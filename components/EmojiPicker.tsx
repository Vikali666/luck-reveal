import React from "react";

type Props = {
    show: boolean;
    emojis?: string[];
    onSelect: (emoji: string) => void;
};

export default function EmojiPicker({ show, emojis = [], onSelect }: Props) {
    if (!show) return null;
    return (
        <div className="absolute bottom-20 right-4 bg-black/70 border border-border-blue p-2 rounded-lg z-50">
        <div className="grid grid-cols-6 gap-2">
        {emojis.map((e) => (
            <button
            key={e}
            type="button"
            className="p-2 hover:bg-white/10 rounded"
            onClick={() => onSelect(e)}
            aria-label={`Insertar ${e}`}
            >
            {e}
            </button>
        ))}
        </div>
        </div>
    );
}
