import React from "react";
import { BenchmarkEntry } from "@/types/agent";

export const EntryDetails = ({ selectedEntry }: {
    selectedEntry: BenchmarkEntry & {
        parsedMetrics: {
            responseSize?: number;
            responseSizeBytes?: number;
            keywordMatches?: { keyword: string, found: boolean }[]
        } | null
    }
}) => {
    return (
        <div className="glass p-8 rounded-3xl border border-primary/20 bg-primary/5 animate-in slide-in-from-right-8 duration-500 shadow-xl">
            <div className="flex justify-between items-start mb-6">
                <div className="space-y-1 block max-w-full">
                    <h3 className="text-xl font-bold font-mono text-primary flex items-center gap-2">
                        <span className="text-2xl">📄</span> {selectedEntry.category} Test
                    </h3>
                    <p className="text-xs text-foreground/60 font-mono break-words leading-relaxed">
                        Prompt: &quot;{selectedEntry.prompt?.substring(0, 100)}...&quot;
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <span className="text-3xl font-black font-mono text-primary">
                        {selectedEntry.score !== null ? `${selectedEntry.score}%` : '--'}
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/40">Model Response</h4>
                    <div className="p-4 rounded-xl bg-background/50 border border-border/50 font-mono text-sm text-foreground/80 max-h-60 overflow-y-auto whitespace-pre-wrap custom-scrollbar">
                        {selectedEntry.output || "No response recorded."}
                    </div>
                </div>

                {selectedEntry.parsedMetrics && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/40">Evaluation Metrics</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl glass border border-border/30">
                                <span className="text-[10px] uppercase text-foreground/40 block mb-1">Response Size</span>
                                <span className="font-mono text-sm">{selectedEntry.parsedMetrics.responseSizeBytes || 0} bytes</span>
                            </div>
                            <div className="p-3 rounded-xl glass border border-border/30">
                                <span className="text-[10px] uppercase text-foreground/40 block mb-1">Keywords Found</span>
                                <span className="font-mono text-sm">
                                    {(selectedEntry.parsedMetrics.keywordMatches || []).filter(m => m.found).length} / {(selectedEntry.parsedMetrics.keywordMatches || []).length}
                                </span>
                            </div>
                        </div>

                        {selectedEntry.parsedMetrics.keywordMatches && selectedEntry.parsedMetrics.keywordMatches.length > 0 && (
                            <div className="space-y-2 mt-4">
                                <span className="text-[10px] uppercase text-foreground/40">Keyword Matches Breakdown</span>
                                <div className="flex flex-wrap gap-2">
                                    {selectedEntry.parsedMetrics.keywordMatches.map((match, i) => (
                                        <div key={i} className={`text-xs px-2 py-1 rounded font-mono border ${match.found
                                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                                            : "bg-red-500/10 text-red-500 border-red-500/20"
                                            }`}>
                                            {match.keyword}: {match.found ? "✓" : "✗"}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
