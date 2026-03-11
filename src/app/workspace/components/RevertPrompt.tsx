"use client";

import React from "react";

export interface DiffBlock {
    type: "added" | "removed" | "modified";
    currStart: number;
    currEnd: number;
    origValue: string;
}

interface RevertPromptProps {
    prompt: DiffBlock | null;
    onCancel: () => void;
    onConfirm: (block: DiffBlock) => void;
}

export default function RevertPrompt({ prompt, onCancel, onConfirm }: RevertPromptProps) {
    if (!prompt) return null;

    return (
        <div className="absolute top-4 right-8 bg-[#252526] border border-[#454545] p-3 rounded shadow-xl z-50 flex flex-col gap-3 min-w-[200px]">
            <p className="text-sm text-[#cccccc]">Revert this Git change?</p>
            <div className="flex justify-end gap-2 mt-1">
                <button 
                    className="px-3 py-1.5 text-xs bg-[#3c3c3c] hover:bg-[#4a4a4a] rounded text-[#cccccc] transition-colors"
                    onClick={onCancel}
                >
                    Cancel
                </button>
                <button 
                    className="px-3 py-1.5 text-xs bg-[#d33833] hover:bg-[#f14c4c] rounded text-white transition-colors"
                    onClick={() => onConfirm(prompt)}
                >
                    Revert Change
                </button>
            </div>
        </div>
    );
}
