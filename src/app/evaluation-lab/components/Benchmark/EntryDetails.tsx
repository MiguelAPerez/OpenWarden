import React from "react";
import { BenchmarkEntry } from "@/types/agent";

export const EntryDetails = ({ selectedEntry }: {
    selectedEntry: BenchmarkEntry & {
        parsedMetrics: {
            responseSizeBytes?: number;
            expectationResults?: { type: string, value: string, found: boolean }[];
            variationName?: string;
        } | null
    }
}) => {
    return (
        <div className="glass p-8 rounded-3xl border border-primary/20 bg-primary/5 animate-in slide-in-from-right-8 duration-500 shadow-xl">
            <div className="flex justify-between items-start mb-6">
                <div className="space-y-1 block max-w-full">
                    <h3 className="text-xl font-bold font-mono text-primary flex items-center gap-2">
                        <span className="text-2xl">📄</span> {selectedEntry.category} Test
                        {selectedEntry.parsedMetrics?.variationName && (
                            <span className="text-[10px] bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-md font-black uppercase tracking-tighter">
                                {selectedEntry.parsedMetrics.variationName}
                            </span>
                        )}
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
                                <span className="text-[10px] uppercase text-foreground/40 block mb-1">Expectations Met</span>
                                <span className="font-mono text-sm">
                                    {(selectedEntry.parsedMetrics.expectationResults || []).filter(m => m.found).length} / {(selectedEntry.parsedMetrics.expectationResults || []).length}
                                </span>
                            </div>
                        </div>

                        {selectedEntry.parsedMetrics.expectationResults && selectedEntry.parsedMetrics.expectationResults.length > 0 && (
                            <div className="space-y-2 mt-4">
                                <span className="text-[10px] uppercase text-foreground/40">Results Breakdown</span>
                                <div className="flex flex-col gap-2">
                                    {selectedEntry.parsedMetrics.expectationResults.map((match, i) => (
                                        <div key={i} className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono group transition-all ${match.found
                                            ? "bg-green-500/5 text-green-500 border-green-500/20"
                                            : "bg-red-500/5 text-red-500 border-red-500/20"
                                            }`}>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${match.found ? "bg-green-500/20" : "bg-red-500/20"
                                                    }`}>
                                                    {match.type}
                                                </span>
                                                <span className="truncate max-w-[200px]">{match.value}</span>
                                            </div>
                                            <span className="font-bold">{match.found ? "PASSED" : "FAILED"}</span>
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
