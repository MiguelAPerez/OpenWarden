import React from "react";
import { ProcessedStat } from "../../hooks/useProcessedBenchmarkData";

interface DrilldownProps {
    selectedId: string;
    stat: ProcessedStat | undefined;
}

export function Drilldown({ selectedId, stat }: DrilldownProps) {
    if (!stat) return null;

    return (
        <div className="glass p-6 rounded-3xl border border-primary/20 bg-primary/5 animate-in slide-in-from-right-8 duration-500">
            <div className="mb-8 space-y-2">
                <h3 className="text-xl font-bold font-mono text-primary flex items-center gap-2">
                    <span className="text-2xl">🔍</span> {selectedId}
                </h3>
                <p className="text-sm font-bold text-primary/80 uppercase tracking-wider">
                    Category Performance Breakdown
                </p>
                <p className="text-[10px] text-foreground/40 italic">
                    Performance across categories
                </p>
            </div>

            <div className="space-y-6">
                {stat.details.map(detail => (
                    <div key={detail.label} className="space-y-2 group">
                        <div className="flex justify-between items-end">
                            <div className="min-w-0 flex-1">
                                <span className="text-sm font-bold uppercase tracking-wider truncate block">{detail.label}</span>
                                <span className="text-[10px] text-foreground/40">({detail.entryCount} tests)</span>
                                {detail.totalExpChecked > 0 && (
                                    <span className="text-[10px] text-emerald-500/60 font-bold ml-2">
                                        [{detail.totalExpMet}/{detail.totalExpChecked} exp]
                                    </span>
                                )}
                            </div>
                            <span className="font-mono font-bold text-sm group-hover:text-primary transition-colors ml-4">{detail.avgScore}%</span>
                        </div>
                        <div className="w-full bg-foreground/5 h-2.5 rounded-full overflow-hidden border border-border/30">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${detail.avgScore >= 90 ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" :
                                    detail.avgScore >= 70 ? "bg-primary shadow-lg shadow-primary/20" :
                                        "bg-amber-500 shadow-lg shadow-amber-500/20"
                                    }`}
                                style={{ width: `${detail.avgScore}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
