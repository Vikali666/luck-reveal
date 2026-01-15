import { useEffect, useState, useCallback } from "react";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    updateDoc,
    doc,
    type DocumentData
} from "firebase/firestore";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage, CHAT_COLLECTION } from "../lib/firebase";
import type { Message } from "../types";

/**
 * Pixelate an image provided as a File or a remote URL.
 * - For File: uses createImageBitmap(file) (no CORS problems).
 * - For URL: uses fetch(url, { mode: 'cors' }) to get a Blob and then createImageBitmap(blob).
 * If createImageBitmap is not available, falls back to using an HTMLImageElement.
 *
 * Returns a JPEG Blob (you can change mime/quality if needed).
 */
async function pixelateImageBlobFromSource(
    source: File | string,
    pixelSize: number
): Promise<Blob> {
    // helper that actually performs drawing from an ImageBitmap onto canvases and returns a blob
    const drawAndBlob = async (imgBitmap: ImageBitmap, mime = "image/jpeg", quality = 0.9) => {
        const w = imgBitmap.width;
        const h = imgBitmap.height;
        if (!w || !h) throw new Error("Imagen con dimensiones inválidas");

        const smallW = Math.max(1, Math.floor(w / pixelSize));
        const smallH = Math.max(1, Math.floor(h / pixelSize));

        const smallCanvas = document.createElement("canvas");
        smallCanvas.width = smallW;
        smallCanvas.height = smallH;
        const sCtx = smallCanvas.getContext("2d");
        if (!sCtx) throw new Error("No se pudo obtener contexto 2D (small)");

        // draw scaled down
        sCtx.drawImage(imgBitmap, 0, 0, smallW, smallH);

        const bigCanvas = document.createElement("canvas");
        bigCanvas.width = w;
        bigCanvas.height = h;
        const bCtx = bigCanvas.getContext("2d");
        if (!bCtx) throw new Error("No se pudo obtener contexto 2D (big)");

        // disable smoothing so pixels are blocky
        bCtx.imageSmoothingEnabled = false;
        bCtx.drawImage(smallCanvas, 0, 0, smallW, smallH, 0, 0, w, h);

        return await new Promise<Blob>((resolve, reject) => {
            bigCanvas.toBlob(
                (blob) => {
                    if (!blob) return reject(new Error("toBlob devolvió null"));
                    resolve(blob);
                },
                mime,
                quality
            );
        });
    };

    // If source is a File, no CORS issues: use createImageBitmap(file)
    if (source instanceof File) {
        try {
            if ("createImageBitmap" in window) {
                const bitmap = await (window as any).createImageBitmap(source as Blob);
                const blob = await drawAndBlob(bitmap);
                // release bitmap
                if (bitmap.close) bitmap.close();
                return blob;
            } else {
                // fallback to Image element using object URL
                const objectUrl = URL.createObjectURL(source);
                try {
                    return await pixelateImageBlobUsingImageElement(objectUrl, pixelSize);
                } finally {
                    URL.revokeObjectURL(objectUrl);
                }
            }
        } catch (err) {
            // bubble up the error to let caller decide on fallback
            throw err;
        }
    }

    // If source is a string (URL), attempt to fetch it (requires CORS on the remote host)
    if (typeof source === "string") {
        try {
            const resp = await fetch(source, { mode: "cors" });
            if (!resp.ok) throw new Error(`Fetch failed: ${resp.status} ${resp.statusText}`);
            const blob = await resp.blob();
            if ("createImageBitmap" in window) {
                const bitmap = await (window as any).createImageBitmap(blob);
                const out = await drawAndBlob(bitmap);
                if (bitmap.close) bitmap.close();
                return out;
            } else {
                // fallback to Image element using object URL
                const objectUrl = URL.createObjectURL(blob);
                try {
                    return await pixelateImageBlobUsingImageElement(objectUrl, pixelSize);
                } finally {
                    URL.revokeObjectURL(objectUrl);
                }
            }
        } catch (err) {
            // If fetch fails due to CORS, this is expected for remote images without CORS headers.
            // Bubble up a clear error message.
            throw new Error(
                `No se pudo obtener la imagen remota (¿CORS?). Error: ${(err as Error).message}`
            );
        }
    }

    throw new Error("Fuente inválida para pixelado");
}

/**
 * Fallback implementation which uses an HTMLImageElement + canvas.
 * Useful when createImageBitmap is not available.
 */
function pixelateImageBlobUsingImageElement(imageUrl: string, pixelSize: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // If the source is a remote URL and you need CORS, you can uncomment the next line.
        // img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                const w = img.naturalWidth || img.width;
                const h = img.naturalHeight || img.height;
                if (!w || !h) return reject(new Error("Imagen cargada con dimensiones 0x0"));
                const smallW = Math.max(1, Math.floor(w / pixelSize));
                const smallH = Math.max(1, Math.floor(h / pixelSize));

                const smallCanvas = document.createElement("canvas");
                smallCanvas.width = smallW;
                smallCanvas.height = smallH;
                const sCtx = smallCanvas.getContext("2d");
                if (!sCtx) return reject(new Error("No se pudo obtener contexto 2D (small)"));

                sCtx.drawImage(img, 0, 0, smallW, smallH);

                const bigCanvas = document.createElement("canvas");
                bigCanvas.width = w;
                bigCanvas.height = h;
                const bCtx = bigCanvas.getContext("2d");
                if (!bCtx) return reject(new Error("No se pudo obtener contexto 2D (big)"));

                bCtx.imageSmoothingEnabled = false;
                bCtx.drawImage(smallCanvas, 0, 0, smallW, smallH, 0, 0, w, h);

                bigCanvas.toBlob(
                    (blob) => {
                        if (!blob) return reject(new Error("toBlob devolvió null"));
                        resolve(blob);
                    },
                    "image/jpeg",
                    0.9
                );
            } catch (err) {
                reject(err);
            }
        };
        img.onerror = (err) => reject(err);
        img.src = imageUrl;
    });
}

export default function useChat(currentUser: { uid: string } | null, nickname?: string) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    useEffect(() => {
        const q = query(collection(db, CHAT_COLLECTION), orderBy("createdAt", "asc"));
        const unsub = onSnapshot(
            q,
            (snap) => {
                const arr = snap.docs.map((d) => {
                    const raw = d.data() as DocumentData;
                    return {
                        id: d.id,
                        uid: raw.uid,
                        nickname: raw.nickname,
                        text: raw.text,
                        photoURL: raw.photoURL,
                        type: (raw.type as Message["type"]) || "text",
                                          isUnlocked: Boolean(raw.isUnlocked),
                                          status: raw.status ?? "pending",
                                          pixelSize: raw.pixelSize,
                                          createdAt: raw.createdAt?.toMillis?.() ?? Date.now()
                    } as Message;
                });
                setMessages(arr);
            },
            (err) => {
                console.error("chat snapshot error", err);
            }
        );
        return () => unsub();
    }, []);

    const sendText = useCallback(
        async (text: string) => {
            if (!text.trim() || !currentUser) return;
            setIsSending(true);
            try {
                await addDoc(collection(db, CHAT_COLLECTION), {
                    uid: currentUser.uid,
                    nickname: nickname ?? "Anon",
                    text: text.trim(),
                             type: "text",
                             isUnlocked: true,
                             status: "approved",
                             createdAt: serverTimestamp()
                });
            } catch (e) {
                console.error(e);
                throw e;
            } finally {
                setIsSending(false);
            }
        },
        [currentUser, nickname]
    );

    const sendPhoto = useCallback(
        async (
            fileOrUrl: { file?: File; url?: string },
            pixelSize = 10,
            onProgress?: (p: number) => void
        ) => {
            if (!currentUser) throw new Error("No user");
            setIsSending(true);
            setUploadProgress(0);
            try {
                let blobToUpload: Blob | null = null;
                let fallbackFile: File | null = null;

                if (fileOrUrl.file) {
                    fallbackFile = fileOrUrl.file;
                    // Prefer using createImageBitmap path via pixelateImageBlobFromSource(file,...)
                    try {
                        blobToUpload = await pixelateImageBlobFromSource(fileOrUrl.file, pixelSize);
                        console.log("[sendPhoto] pixelado OK (file)", { size: blobToUpload.size, type: blobToUpload.type });
                    } catch (pixErr) {
                        // If pixelation fails for some reason, fallback to original file upload.
                        console.warn("[sendPhoto] pixelado falló, haré fallback al file original", pixErr);
                        blobToUpload = null;
                    }
                } else if (fileOrUrl.url) {
                    // For remote URLs we try to fetch and pixelate; if it fails due to CORS we let caller handle it.
                    try {
                        blobToUpload = await pixelateImageBlobFromSource(fileOrUrl.url, pixelSize);
                        console.log("[sendPhoto] pixelado OK (url)", { size: blobToUpload.size, type: blobToUpload.type });
                    } catch (pixErr) {
                        console.error("[sendPhoto] pixelado desde URL falló (posible CORS)", pixErr);
                        throw pixErr;
                    }
                } else {
                    throw new Error("No file or url provided");
                }

                // If pixelation failed and we have the original file, upload original
                const toUpload = blobToUpload ?? (fallbackFile as File);
                if (!toUpload) throw new Error("No hay blob o file para subir");

                const contentType = (toUpload as Blob).type || (fallbackFile?.type ?? "image/jpeg");
                const path = `photos/${currentUser.uid}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.jpg`;
                const sRef = storageRef(storage, path);

                console.log("[sendPhoto] subiendo a Storage", { path, contentType, size: (toUpload as Blob).size });

                const metadata = { contentType };

                const uploadTask = uploadBytesResumable(sRef, toUpload as Blob, metadata);

                await new Promise<void>((resolve, reject) => {
                    uploadTask.on(
                        "state_changed",
                        (snapshot) => {
                            const progress = Math.round((snapshot.bytesTransferred / (snapshot.totalBytes || 1)) * 100);
                            setUploadProgress(progress);
                            if (onProgress) onProgress(progress);
                        },
                        (error) => {
                            console.error("[sendPhoto] upload error", (error as any).code, (error as any).message || error);
                            setUploadProgress(null);
                            reject(error);
                        },
                        async () => {
                            try {
                                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                                console.log("[sendPhoto] upload completo, downloadURL:", downloadURL);
                                await addDoc(collection(db, CHAT_COLLECTION), {
                                    uid: currentUser.uid,
                                    nickname: nickname ?? "Anon",
                                    photoURL: downloadURL,
                                    type: "photo",
                                    isUnlocked: false,
                                    status: "pending",
                                    pixelSize,
                                    createdAt: serverTimestamp()
                                });
                                setUploadProgress(null);
                                resolve();
                            } catch (err) {
                                console.error("[sendPhoto] post-upload error (Firestore)", err);
                                reject(err);
                            }
                        }
                    );
                });
            } catch (err) {
                console.error("[sendPhoto] fallo completo", err);
                throw err;
            } finally {
                setIsSending(false);
            }
        },
        [currentUser, nickname]
    );

    const acceptPhoto = useCallback(async (messageId: string) => {
        try {
            const d = doc(db, CHAT_COLLECTION, messageId);
            await updateDoc(d, { isUnlocked: true, status: "approved" });
        } catch (e) {
            console.error(e);
            throw e;
        }
    }, []);

    return {
        messages,
        isSending,
        uploadProgress,
        sendText,
        sendPhoto,
        acceptPhoto
    };
}
