import React from "react";

type Props = {
    progress: number; // 0-100
};

export default function UploadProgress({ progress }: Props) {
    return (
        <div
        className="upload-progress fixed left-0 right-0 flex justify-center pointer-events-none z-40"
        aria-hidden={false}
        aria-live="polite"
        >
        <div className="w-[92%] max-w-3xl mt-2 mb-1">
        <div className="relative w-full h-2 rounded-full bg-white/6 overflow-hidden border border-border-blue">
        <div
        className="absolute left-0 top-0 h-full bg-primary transition-all"
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
        </div>
        <div className="text-xs text-right mt-1 opacity-80 select-none pr-1">
        Subiendo imagen — {Math.round(progress)}%
        </div>
        </div>
        </div>
    );
}
