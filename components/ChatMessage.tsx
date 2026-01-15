import React from "react";
import type { Message } from "../types";

type Props = {
    message: Message;
    currentUserId?: string | null;
    onAcceptPhoto?: (id: string) => Promise<void>;
};

export default function ChatMessage({ message, currentUserId, onAcceptPhoto }: Props) {
    const isMe = message.uid && currentUserId && message.uid === currentUserId;
    return (
        <div className={`msg max-w-[85%] ${isMe ? "self-end" : "self-start"}`}>
        <div className={`bubble ${isMe ? "bg-primary text-white border-none" : "bg-[rgba(30,58,95,0.4)] border border-border-blue"}`}>
        {message.type === "text" && <div className="whitespace-pre-wrap">{message.text}</div>}

        {message.type === "photo" && (
            <div>
            <img
            src={message.photoURL}
            alt={message.text ?? "Foto"}
            className={`photo-image mt-1 ${message.isUnlocked ? "unlocked" : "pixelated"}`}
            />
            {!message.isUnlocked && !isMe && (
                <div className="mt-2 flex gap-2">
                <button
                type="button"
                className="btn-main bg-white/5 px-3 py-1 rounded"
                onClick={() => message.id && onAcceptPhoto && onAcceptPhoto(message.id)}
                >
                Aceptar foto
                </button>
                </div>
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
