"use client";

import React from "react";

interface PerformanceSummary {
    agentId: string;
    agentName: string;
    avgScore: number;
    totalBenchmarks: number;
    latestScore: number | null;
    latestDuration: number | null;
    lastUpdated: Date | null;
}

export const AgentPerformanceTab = ({
    summaries
}: {
    summaries: PerformanceSummary[];
}) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {summaries.map((summary) => (
                    <div 
                        key={summary.agentId} 
                        className="glass p-6 rounded-3xl border border-border/50 hover:border-primary/30 transition-all group bg-foreground/[0.02] flex flex-col"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-foreground/80 group-hover:text-primary transition-colors">
                                    {summary.agentName}
                                </h3>
                                <p className="text-xs text-foreground/40 font-mono uppercase tracking-widest mt-1">
                                    {summary.totalBenchmarks} Benchmarks run
                                </p>
                            </div>
                            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold ring-1 ring-primary/20">
                                {summary.avgScore ? `${Math.round(summary.avgScore)}% Avg` : "N/A"}
                            </div>
                        </div>

                        <div className="space-y-4 flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-foreground/30 tracking-tight">Latest Score</label>
                                    <p className="text-2xl font-black text-foreground/70">
                                        {summary.latestScore !== null ? `${summary.latestScore}%` : "-"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-foreground/30 tracking-tight">Latency</label>
                                    <p className="text-2xl font-black text-foreground/70">
                                        {summary.latestDuration !== null ? `${(summary.latestDuration / 1000).toFixed(1)}s` : "-"}
                                    </p>
                                </div>
                            </div>

                            {summary.lastUpdated && (
                                <div className="pt-4 border-t border-border/30 mt-auto">
                                    <p className="text-[10px] text-foreground/30 font-medium">
                                        Last active: {new Date(summary.lastUpdated).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {summaries.length === 0 && (
                    <div className="col-span-full py-20 text-center glass rounded-3xl border-2 border-dashed border-border/50 opacity-50">
                        <div className="text-4xl mb-4">📈</div>
                        <h3 className="text-lg font-bold">No performance data yet</h3>
                        <p className="text-sm text-foreground/40 max-w-xs mx-auto mt-2">
                            Run some benchmarks in the Evaluation Lab to see how your agents are performing.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
