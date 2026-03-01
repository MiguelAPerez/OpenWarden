"use client";

import React, { useEffect, useState } from "react";
import { getBenchmarkProgress, simulateBenchmarkStep } from "@/app/actions/agent";
import { Benchmark, BenchmarkEntry } from "@/types/agent";
import { useRouter } from "next/navigation";
import { getOllamaModels } from "@/app/actions/ollama";

const LiveTimer = ({ startedAt }: { startedAt: Date | string }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startedAt) return;
        // Adjust for any small clock skew by not going below 0
        const start = new Date(startedAt).getTime();

        const interval = setInterval(() => {
            setElapsed(Math.max(0, Date.now() - start));
        }, 100);
        return () => clearInterval(interval);
    }, [startedAt]);

    return <span>{(elapsed / 1000).toFixed(1)}s</span>;
};

export const BenchmarkProgress = ({
    initialBenchmarkId
}: {
    initialBenchmarkId: string | null
}) => {
    const [benchmark, setBenchmark] = useState<(Benchmark & { entries: BenchmarkEntry[] }) | null>(null);
    const [modelCapabilities, setModelCapabilities] = useState<Record<string, string[]>>({});
    const router = useRouter();

    useEffect(() => {
        async function loadCapabilities() {
            try {
                const models = await getOllamaModels();
                const caps: Record<string, string[]> = {};
                models.forEach(m => {
                    try {
                        if (m.details) {
                            const parsed = JSON.parse(m.details);
                            caps[m.name] = parsed.capabilities || [];
                        }
                    } catch { }
                });
                setModelCapabilities(caps);
            } catch (err) {
                console.error("Failed to load capabilities", err);
            }
        }
        loadCapabilities();
    }, []);

    useEffect(() => {
        if (!initialBenchmarkId) return;

        const fetchData = async () => {
            const data = await getBenchmarkProgress(initialBenchmarkId) as (Benchmark & { entries: BenchmarkEntry[] }) | null;
            setBenchmark(prev => {
                if (prev && prev.status === "running" && data?.status === "completed") {
                    router.refresh(); // Refresh server state (e.g. results component)
                }
                return data;
            });
        };


        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, [initialBenchmarkId, router]);

    // Simulate progress if it's running
    useEffect(() => {
        if (benchmark?.status === "running") {
            const timer = setTimeout(async () => {
                const res = await simulateBenchmarkStep(benchmark.id);
                if (res.finished) {
                    // Refresh data
                    const data = await getBenchmarkProgress(benchmark.id);
                    setBenchmark(data as (Benchmark & { entries: BenchmarkEntry[] }) | null);
                    router.refresh();
                }

            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [benchmark, router]);

    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
    const [collapsedModels, setCollapsedModels] = useState<Record<string, boolean>>({});

    const toggleModelCollapse = (modelName: string) => {
        setCollapsedModels(prev => ({
            ...prev,
            [modelName]: prev[modelName] === false ? true : false
        }));
    };

    const selectedEntry = React.useMemo(() => {
        if (!benchmark) return null;
        const entry = benchmark.entries.find(e => e.id === selectedEntryId);
        if (!entry) return null;

        // Pre-parse metrics if they exist
        let parsedMetrics = null;
        if (entry.metrics) {
            try {
                parsedMetrics = JSON.parse(entry.metrics);
            } catch (e) {
                console.error("Failed to parse metrics", e);
            }
        }

        return { ...entry, parsedMetrics };
    }, [benchmark, selectedEntryId]);

    if (!benchmark && initialBenchmarkId) {
        return <div className="p-8 text-center text-foreground/40 italic">Loading benchmark progress...</div>;
    }

    if (!benchmark) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-12 glass border-2 border-dashed border-border/30 rounded-3xl text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center">
                    <span className="text-3xl grayscale">📊</span>
                </div>
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground/60">No Active Benchmark</h3>
                    <p className="text-sm text-foreground/20 max-w-xs mx-auto">
                        Select or create a run in the &quot;Runs&quot; tab to see details here.
                    </p>
                </div>
            </div>
        );
    }

    const progress = (benchmark.completedEntries / benchmark.totalEntries) * 100;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="lg:col-span-2 space-y-8">
                <div className="glass p-8 rounded-3xl border border-primary/20 shadow-2xl bg-gradient-to-br from-background/40 to-primary/5">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <span className={`w-3 h-3 rounded-full animate-pulse ${benchmark.status === "running" ? "bg-green-500 shadow-green-500/50" : "bg-primary shadow-primary/50"
                                    }`} />
                                <h2 className="text-2xl font-bold text-foreground/90">{benchmark.name}</h2>
                            </div>
                            <p className="text-sm text-foreground/40 font-mono uppercase tracking-widest pl-6">
                                ID: {benchmark.id.slice(0, 8)}... • Status: {benchmark.status}
                            </p>
                        </div>
                        <div className="text-right px-6 py-4 glass bg-background/40 rounded-2xl border border-border/50">
                            <span className="text-3xl font-black text-primary font-mono">{Math.round(progress)}%</span>
                            <p className="text-[10px] font-bold uppercase tracking-tighter text-foreground/30">Total Progress</p>
                        </div>
                    </div>

                    <div className="w-full bg-foreground/5 h-4 rounded-full overflow-hidden mb-4 p-1 border border-border/30">
                        <div
                            className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary/40 rounded-full transition-all duration-1000 shadow-lg shadow-primary/20"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between px-2">
                        <span className="text-xs font-bold text-foreground/30 uppercase tracking-widest">
                            {benchmark.completedEntries} / {benchmark.totalEntries} Evaluated
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/40 flex items-center gap-2">
                        Evaluation Queue
                        <span className="text-[10px] lowercase italic opacity-50 px-2">(Click an entry to view details)</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {Object.entries(
                            benchmark.entries.reduce((acc, entry) => {
                                if (!acc[entry.model]) acc[entry.model] = [];
                                acc[entry.model].push(entry);
                                return acc;
                            }, {} as Record<string, BenchmarkEntry[]>)
                        ).map(([modelName, entries]) => {
                            const modelCompleted = entries.filter(e => e.status === "completed" || e.status === "failed").length;
                            const modelProgress = entries.length > 0 ? (modelCompleted / entries.length) * 100 : 0;
                            const isCollapsed = collapsedModels[modelName] !== false;

                            return (
                                <div key={modelName} className="space-y-3 relative">
                                    <h4
                                        onClick={() => toggleModelCollapse(modelName)}
                                        className="text-xs font-bold font-mono tracking-widest text-foreground/60 sticky top-0 bg-background/90 backdrop-blur-xl py-2 z-10 border-b border-border/10 flex items-center justify-between gap-2 rounded-t-lg cursor-pointer hover:text-primary transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-primary w-4">{isCollapsed ? "▶" : "▼"}</span>
                                            <span className="text-primary">⚡</span> {modelName}
                                            {(modelCapabilities[modelName]?.includes("tools") || modelCapabilities[modelName]?.includes("thinking")) && (
                                                <span className="flex gap-1.5 ml-1" title="Model Capabilities">
                                                    {modelCapabilities[modelName].includes("tools") && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 leading-none" title="Supports Tools">🔧</span>}
                                                    {modelCapabilities[modelName].includes("thinking") && <span className="text-[9px] px-1 py-0.5 rounded bg-purple-500/10 text-purple-600 border border-purple-500/20 leading-none" title="Has Thinking Phase">🧠</span>}
                                                </span>
                                            )}
                                            <span className="text-[10px] opacity-60 normal-case">({modelCompleted}/{entries.length})</span>
                                        </div>
                                        {isCollapsed && (
                                            <div className="w-24 bg-foreground/5 h-2 rounded-full overflow-hidden border border-border/30">
                                                <div
                                                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-1000 shadow-lg shadow-primary/20"
                                                    style={{ width: `${modelProgress}%` }}
                                                />
                                            </div>
                                        )}
                                    </h4>
                                    {!isCollapsed && (
                                        <div className="grid grid-cols-1 gap-3">
                                            {entries.map((entry, idx) => (
                                                <div
                                                    key={entry.id}
                                                    onClick={() => (entry.status === "completed" || entry.status === "running") && setSelectedEntryId(entry.id)}
                                                    className={`glass p-4 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${entry.status === "running"
                                                        ? selectedEntryId === entry.id ? "border-primary bg-primary/10 shadow-xl" : "border-primary/50 bg-primary/5 scale-[1.01] shadow-xl"
                                                        : entry.status === "completed"
                                                            ? selectedEntryId === entry.id ? "border-primary bg-primary/5" : "border-green-500/20 hover:border-primary/40"
                                                            : "border-border/30 opacity-50 cursor-not-allowed"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-8 h-8 rounded-xl bg-foreground/5 flex items-center justify-center font-mono text-xs font-bold text-foreground/30 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                            {(idx + 1).toString().padStart(2, '0')}
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-foreground/80">{entry.category || "Uncategorized"}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${entry.status === "running" ? "text-primary animate-pulse" :
                                                                    entry.status === "completed" ? "text-green-500/60" : "text-foreground/20"
                                                                    }`}>
                                                                    {entry.status}
                                                                </span>
                                                                {entry.status === "completed" && entry.score !== null && (
                                                                    <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-black">
                                                                        {entry.score}%
                                                                    </span>
                                                                )}
                                                                {entry.status === "completed" && entry.metrics && (
                                                                    <span className="text-[10px] text-foreground/20 italic">
                                                                        {(() => {
                                                                            try {
                                                                                const m = JSON.parse(entry.metrics);
                                                                                return m.keywordMatches?.filter((match: { found: boolean }) => match.found).length || 0;
                                                                            } catch {
                                                                                return 0;
                                                                            }
                                                                        })()} matches
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        {entry.duration && entry.status === "completed" && (
                                                            <span className="text-[10px] text-foreground/20 font-mono">
                                                                {entry.duration}ms
                                                            </span>
                                                        )}
                                                        {entry.status === "running" && entry.startedAt && (
                                                            <span className="text-[10px] text-primary/70 font-mono flex items-center gap-2">
                                                                <LiveTimer startedAt={entry.startedAt} />
                                                            </span>
                                                        )}
                                                        {entry.status === "running" && (
                                                            <div className="flex items-center gap-1">
                                                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                                                            </div>
                                                        )}
                                                        {entry.status === "completed" && (
                                                            <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                                                <span className="text-green-500 text-xs">✓</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-1">
                {selectedEntry ? (
                    <div className="glass p-6 rounded-3xl border border-primary/30 space-y-6 sticky top-8 animate-in slide-in-from-right-4 duration-500">
                        <div className="flex justify-between items-center">
                            <h4 className="text-lg font-bold text-foreground">Entry Details</h4>
                            <button onClick={() => setSelectedEntryId(null)} className="text-foreground/30 hover:text-foreground">✕</button>
                        </div>

                        <div className="space-y-4">
                            {selectedEntry.status === "running" ? (
                                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                                        </div>
                                        <span className="text-sm font-bold text-primary">Calling Ollama API Component...</span>
                                    </div>
                                    <p className="text-xs text-foreground/60">
                                        Model: <span className="font-bold">{selectedEntry.model}</span>
                                    </p>
                                    {selectedEntry.startedAt && (
                                        <p className="text-xs font-mono text-foreground/40">
                                            Elapsed: <span className="text-primary"><LiveTimer startedAt={selectedEntry.startedAt} /></span>
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 bg-background/40 rounded-2xl border border-border/50">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 mb-2">Metrics</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xl font-black text-primary">{selectedEntry.score}%</p>
                                            <p className="text-[8px] uppercase font-bold text-foreground/20">Accuracy</p>
                                        </div>
                                        <div>
                                            <p className="text-xl font-black text-foreground/60">{selectedEntry.duration}ms</p>
                                            <p className="text-[8px] uppercase font-bold text-foreground/20">Latency</p>
                                        </div>
                                        <div>
                                            <p className="text-xl font-black text-foreground/60">{selectedEntry.parsedMetrics?.responseSize || 0}c</p>
                                            <p className="text-[8px] uppercase font-bold text-foreground/20">Size</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedEntry.prompt && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Prompt {selectedEntry.status === "running" && "(Being Processing)"}</p>
                                    <div className="p-3 bg-foreground/5 rounded-xl text-xs text-foreground/60 leading-relaxed max-h-32 overflow-y-auto italic">
                                        &quot;{selectedEntry.prompt}&quot;
                                    </div>
                                </div>
                            )}

                            {selectedEntry.status === "completed" && (
                                <>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Output</p>
                                        <div className="p-3 bg-foreground/5 rounded-xl text-xs text-foreground/80 leading-relaxed max-h-48 overflow-y-auto font-mono">
                                            {selectedEntry.output}
                                        </div>
                                    </div>

                                    {selectedEntry.parsedMetrics && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Keyword Matches</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedEntry.parsedMetrics.keywordMatches?.map((m: { keyword: string, found: boolean }, i: number) => (
                                                    <span
                                                        key={i}
                                                        className={`px-2 py-1 rounded-md text-[9px] font-bold border ${m.found ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                                                            }`}
                                                    >
                                                        {m.keyword} {m.found ? "✓" : "✗"}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center glass border-2 border-dashed border-border/30 rounded-3xl p-8 text-center text-foreground/20 italic">
                        <span className="text-4xl mb-4 block">🔍</span>
                        Select a completed entry to view detailed metrics and response analysis.
                    </div>
                )}
            </div>
        </div>
    );
};
