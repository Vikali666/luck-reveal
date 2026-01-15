import React, { useEffect, useState } from "react";

type PhotoPayload = { file?: File; url?: string };

type Props = {
    show: boolean;
    photo?: PhotoPayload | null;
    onClose: () => void;
    onConfirm: (payload: { file?: File; url?: string; pixelSize: number }) => Promise<void>;
};

export default function PhotoModal({ show, photo, onClose, onConfirm }: Props) {
    const [pixelSize, setPixelSize] = useState<number>(10);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (!show) setPixelSize(10);
    }, [show]);

        if (!show || !photo) return null;

        const handleConfirm = async () => {
            setIsSending(true);
            try {
                await onConfirm({ file: photo.file, url: photo.url, pixelSize });
            } catch (e) {
                console.error("Error enviando foto desde modal", e);
            } finally {
                setIsSending(false);
            }
        };

        return (
            <div className="photo-modal-overlay fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="photo-modal bg-bg-dark p-6 rounded-2xl w-full max-w-md border border-primary">
            <h3 className="text-lg mb-3">Previsualizar foto</h3>

            {photo.url ? (
                <img src={photo.url} alt="Previsualización" className="w-full rounded-md mb-3" />
            ) : (
                <div className="w-full h-48 bg-white/5 rounded-md mb-3 flex items-center justify-center">
                No hay vista previa
                </div>
            )}

            <label className="block text-sm mb-1">Tamaño de píxel: {pixelSize}</label>
            <input
            type="range"
            min={2}
            max={40}
            value={pixelSize}
            onChange={(e) => setPixelSize(Number(e.target.value))}
            className="w-full"
            />

            <div className="mt-4 flex gap-3 justify-end">
            <button
            type="button"
            className="btn-main px-3 py-1 rounded"
            onClick={onClose}
            disabled={isSending}
            >
            Cancelar
            </button>
            <button
            type="button"
            className="send-btn px-3 py-1 rounded bg-primary text-black"
            onClick={handleConfirm}
            disabled={isSending}
            >
            {isSending ? "Enviando..." : "Enviar foto"}
            </button>
            </div>
            </div>
            </div>
        );
}
