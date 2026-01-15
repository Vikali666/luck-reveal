import React, { useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Header from "./components/Header";
import ChatMessage from "./components/ChatMessage";
import EmojiPicker from "./components/EmojiPicker";
import PhotoModal from "./components/PhotoModal";
import UploadProgress from "./components/UploadProgress";
import useAuth from "./hooks/useAuth";
import useChat from "./hooks/useChat";
import type { Message } from "./types";

export default function App() {
    const { user } = useAuth();
    const [status, setStatus] = useState<"splash" | "setup" | "chat">("splash");
    const [nickname, setNickname] = useState("");
    const [accepted, setAccepted] = useState(false);
    const [isMatching, setIsMatching] = useState(false);

    const [messageText, setMessageText] = useState("");
    const [showEmojis, setShowEmojis] = useState(false);

    const [selectedPhoto, setSelectedPhoto] = useState<{ file?: File; url?: string } | null>(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const endRef = useRef<HTMLDivElement | null>(null);

    const { messages, isSending, uploadProgress, sendText, sendPhoto, acceptPhoto } = useChat(user, nickname);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const startMatching = async () => {
        if (!nickname.trim() || !accepted) return;
        setIsMatching(true);
        try {
            await new Promise((r) => setTimeout(r, 400));
            setStatus("chat");
            toast.success("Bienvenido/a");
        } finally {
            setIsMatching(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim()) return;
        try {
            await sendText(messageText);
            setMessageText("");
        } catch {
            toast.error("Error al enviar mensaje");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setSelectedPhoto({ file, url });
        setShowPhotoModal(true);
        e.target.value = "";
    };

    const handlePhotoConfirm = async ({ file, url, pixelSize }: { file?: File; url?: string; pixelSize: number }) => {
        try {
            // sendPhoto already reports uploadProgress via the hook
            await sendPhoto({ file, url }, pixelSize, (p) => {
                // opcional: callback local si quieres reaccionar al progreso aquí
                // console.log("progress:", p);
            });
            toast.info("Foto enviada (pendiente de aprobación)");
        } catch {
            toast.error("Error al enviar foto");
        }
    };

    return (
        <div className="app-container h-screen flex flex-col">
        <Header />
        {status === "splash" && (
            <div className="flex-1 flex items-center justify-center">
            <div className="splash-card bg-[rgba(255,255,255,0.03)] p-6 rounded-lg border border-border-blue text-center">
            <h1 className="text-2xl font-bold">Luck Reveal</h1>
            <p className="text-sm opacity-70 mt-2">v0.1.0</p>
            <button className="btn-main mt-4 px-4 py-2 bg-primary rounded" onClick={() => setStatus("setup")}>
            ENTRAR
            </button>
            </div>
            </div>
        )}

        {status === "setup" && (
            <div className="flex-1 flex items-center justify-center">
            <div className="setup-card bg-[rgba(255,255,255,0.02)] p-6 rounded-lg border border-border-blue w-full max-w-md">
            <input
            placeholder="Tu apodo"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={12}
            className="w-full mb-3 p-3 rounded-md bg-black/30 border border-border-blue"
            />
            <label className="flex items-center gap-2 text-sm mb-3">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            Acepto reglas de respeto
            </label>
            <button
            className="btn-main w-full py-2 bg-primary rounded disabled:opacity-50"
            disabled={!accepted || !nickname.trim() || isMatching}
            onClick={startMatching}
            >
            {isMatching ? "CARGANDO..." : "CHAT GLOBAL 🌎"}
            </button>
            </div>
            </div>
        )}

        {status === "chat" && (
            <main className="flex-1 flex flex-col bg-bg-dark">
            {/* uploadProgress: muestra barra fija encima del footer durante la subida */}
            {typeof uploadProgress === "number" && uploadProgress >= 0 && <UploadProgress progress={uploadProgress} />}

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.map((m: Message) => (
                <ChatMessage key={m.id} message={m} currentUserId={user?.uid} onAcceptPhoto={acceptPhoto} />
            ))}
            <div ref={endRef} />
            </div>

            <footer className="p-3 border-t border-border-blue bg-[rgba(10,14,26,0.98)] flex items-center gap-2">
            <input type="file" accept="image/png, image/jpeg" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            <input
            className="chat-footer-input flex-1 p-3 rounded-lg bg-black/30 border border-border-blue"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={isSending ? "Enviando..." : "Mensaje..."}
            disabled={isSending}
            onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    handleSendMessage();
                }
            }}
            />

            <EmojiPicker
            show={showEmojis}
            emojis={["😊", "🔥", "❤️", "😂", "😏", "👍"]}
            onSelect={(emoji) => {
                setMessageText((p) => p + emoji);
                setShowEmojis(false);
            }}
            />

            <button className="emoji-toggle-btn px-3 py-2 rounded" onClick={() => setShowEmojis((s) => !s)} aria-label="Abrir emojis">
            😊
            </button>

            <button
            className="photo-btn px-3 py-2 rounded"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            aria-label="Enviar foto"
            >
            📸
            </button>

            <button className="send-btn px-3 py-2 rounded bg-primary" onClick={handleSendMessage} disabled={isSending || !messageText.trim()}>
            {isSending ? "..." : "➤"}
            </button>
            </footer>

            {showEmojis && (
                <EmojiPicker show={showEmojis} emojis={["😊", "🔥", "❤️", "😂", "😏", "👍"]} onSelect={(e) => setMessageText((p) => p + e)} />
            )}
            </main>
        )}

        <PhotoModal
        show={showPhotoModal}
        photo={selectedPhoto}
        onClose={() => {
            setShowPhotoModal(false);
            if (selectedPhoto?.url) URL.revokeObjectURL(selectedPhoto.url);
            setSelectedPhoto(null);
        }}
        onConfirm={handlePhotoConfirm}
        />

        <ToastContainer position="top-center" autoClose={1500} theme="dark" hideProgressBar />
        </div>
    );
}
