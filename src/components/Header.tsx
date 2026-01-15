import React from "react";

export default function Header(): JSX.Element {
    return (
        <header className="w-full border-b border-border-blue py-3 px-4 flex items-center justify-between bg-bg-dark">
        <div className="flex items-center gap-3">
        <div className="text-lg font-semibold">Luck Reveal</div>
        <div className="text-sm opacity-70">Chat Global</div>
        </div>
        <div className="text-sm opacity-60">v0.1.0</div>
        </header>
    );
}
