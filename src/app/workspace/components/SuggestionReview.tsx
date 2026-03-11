"use client";

import React from "react";

export interface FileChange {
    startLine: number;
    endLine: number;
    column: number;
    originalContent: string;
    suggestedContent: string;
}

export interface PendingSuggestion {
    chatId: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: any[];
    filesChanged: Record<string, FileChange>;
}

interface SuggestionReviewProps {
    suggestion: PendingSuggestion | null;
    onApprove: () => void;
    onReject: () => void;
}

export default function SuggestionReview({ suggestion, onApprove, onReject }: SuggestionReviewProps) {
    if (!suggestion) return null;

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#252526] border border-[#454545] p-4 rounded-xl shadow-2xl z-50 flex items-center gap-6 min-w-[350px]">
            <div className="flex-1">
                <h4 className="text-sm font-semibold text-[#cccccc] mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    AI Suggestion Applied
                </h4>
                <p className="text-xs text-[#858585] truncate max-w-[250px]" title={Object.keys(suggestion.filesChanged).join(", ")}>
                    {Object.keys(suggestion.filesChanged).length === 1 
                        ? Object.keys(suggestion.filesChanged)[0].split("/").pop()
                        : `${Object.keys(suggestion.filesChanged).length} files modified`}
                </p>
            </div>
            <div className="flex justify-end gap-2 shrink-0">
                <button 
                    className="px-4 py-2 text-xs font-medium bg-[#3c3c3c] border border-[#454545] hover:bg-[#4a4a4a] rounded-lg text-[#cccccc] transition-colors"
                    onClick={onReject}
                >
                    Reject
                </button>
                <button 
                    className="px-4 py-2 text-xs font-medium bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground transition-colors"
                    onClick={onApprove}
                >
                    Approve
                </button>
            </div>
        </div>
    );
}
