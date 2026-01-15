import React, { useEffect, useState } from "react";

type Props = {
    show: boolean;
    photo?: { file?: File; url?: string } | null;
    onClose: () => void;
    onConfirm: (payload: { file?: File; url?: string; pixelSize: number }) => Promise<void>;
};

export default function PhotoModal({ show, photo, onClose, onConfirm }: Props) {
    const [pixelSize, setPixelSize] = useState(10);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (!show) setPixelSize(10);
    }, [show]);

        if (!show || !photo) return null;

        const handleSend = async () => {
            setIsSending(true);
            try {
                await onConfirm({ file: photo.file, url: photo.url, pixelSize });
            } finally {
                setIsSending(false);
                onClose();
            }
        };

        return (
            <div className="photo-modal-overlay fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="photo-modal bg-bg-dark p-6 rounded-2xl w-full max-w-md border border-primary">
            <h3 className="text-lg mb-3">Previsualizar</h3>
            {photo.url && <img src={photo.url} alt="preview" className="w-full rounded-md mb-3" />}
            <label className="block text-sm mb-1">Tamaño de píxel: {pixelSize}</label>
            <input
            type="range"
            min={2}
            max={40}
            value={pixelSize}
            onChange={(e) => setPixelSize(Number(e.target.value))}
            />
            <div className="mt-4 flex gap-3 justify-end">
            <button type="button" className="btn-main px-3 py-1 rounded" onClick={onClose} disabled={isSending}>
            Cancelar
            </button>
            <button type="button" className="send-btn px-3 py-1 rounded bg-primary" onClick={handleSend} disabled={isSending}>
            {isSending ? "Enviando..." : "Enviar foto"}
            </button>
            </div>
            </div>
            </div>
        );
}
