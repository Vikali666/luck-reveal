import React from "react";
import type { Message } from "../types";

type Props = {
    message: Message;
    currentUserId?: string | null;
    onAcceptPhoto?: (id: string) => Promise<void>;
};

export default function ChatMessage({ message, currentUserId, onAcceptPhoto }: Props) {
    const isMe = message.uid && currentUserId && message.uid === currentUserId;

    const handleAccept = async () => {
        if (!message.id || !onAcceptPhoto) return;
        try {
            await onAcceptPhoto(message.id);
        } catch (e) {
            // Puedes mostrar toast desde el padre; aquí sólo fallback console
            console.error("Error aceptando foto", e);
        }
    };

    return (
        <div className={`msg max-w-[85%] ${isMe ? "self-end" : "self-start"}`}>
        <div
        className={`bubble ${
            isMe ? "bg-primary text-white border-none" : "bg-[rgba(30,58,95,0.4)] border border-border-blue"
        }`}
        >
        {/* Texto */}
        {message.type === "text" && (
            <div className="whitespace-pre-wrap break-words">{message.text}</div>
        )}

        {/* Foto */}
        {message.type === "photo" && (
            <div>
            <img
            src={message.photoURL}
            alt={message.text ?? "Foto enviada"}
            loading="lazy"
            className={`photo-image mt-1 ${message.isUnlocked ? "unlocked" : "pixelated"}`}
            />

            {/* Estado y acción para fotos bloqueadas */}
            {!message.isUnlocked && !isMe && (
                <div className="mt-2 flex gap-2">
                <button
                type="button"
                className="btn-main bg-white/5 px-3 py-1 rounded"
                onClick={handleAccept}
                >
                Aceptar foto
                </button>
                </div>
            )}

            {!message.isUnlocked && isMe && (
                <div className="mt-2 text-xs opacity-80">Tu foto (pendiente de aprobación)</div>
            )}
            </div>
        )}

        <div className="mt-2 text-xs opacity-70">
        <span>{message.nickname ?? (isMe ? "Tú" : "Anon")}</span>
        <span> · </span>
        <span>{message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : ""}</span>
        </div>
        </div>
        </div>
    );
}
