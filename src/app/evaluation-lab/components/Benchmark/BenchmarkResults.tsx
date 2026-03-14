"use client";

import React, { useState, useEffect } from "react";
import { Benchmark, BenchmarkEntry } from "@/types/agent";
import { getOllamaModels } from "@/app/actions/ollama";
import { clearBenchmarkData } from "@/app/actions/benchmarks";
import { useProcessedBenchmarkData, ViewType } from "../../hooks/useProcessedBenchmarkData";
import { Leaderboard } from "./Leaderboard";
import { Drilldown } from "./Drilldown";

export const BenchmarkResults = ({
    data
}: {
    data: (Benchmark & { entries: BenchmarkEntry[] })[];
}) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [modelCapabilities, setModelCapabilities] = useState<Record<string, string[]>>({});
    const [currentView, setCurrentView] = useState<ViewType>("models");
    const [isResetting, setIsResetting] = useState(false);

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

    const processedData = useProcessedBenchmarkData(data, currentView);

    const [showConfirmReset, setShowConfirmReset] = useState(false);

    const handleReset = async () => {
        setIsResetting(true);
        setShowConfirmReset(false);
        try {
            await clearBenchmarkData();
        } catch (err) {
            console.error("Failed to reset data", err);
            alert("Failed to reset data");
        } finally {
            setIsResetting(false);
        }
    };

    if (!data.length || processedData.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-12 glass border-2 border-dashed border-border/30 rounded-3xl text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center">
                    <span className="text-3xl grayscale">🏆</span>
                </div>
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground/60">No Results Yet</h3>
                    <p className="text-sm text-foreground/40 max-w-xs mx-auto">
                        Complete at least one benchmark run to see aggregated performance data here.
                    </p>
                </div>
            </div>
        );
    }

    const selectedStat = processedData.find(s => s.id === selectedId);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header & View Switcher */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-2 p-1 bg-foreground/5 rounded-xl border border-border/50 w-fit">
                    {(["models", "variations"] as ViewType[]).map(view => (
                        <button
                            key={view}
                            onClick={() => {
                                setCurrentView(view);
                                setSelectedId(null);
                            }}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${currentView === view
                                ? "bg-background text-foreground shadow-sm border border-border/50"
                                : "text-foreground/40 hover:text-foreground/60 hover:bg-foreground/5"
                                }`}
                        >
                            {view === "variations" ? "Personas" : view}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {showConfirmReset ? (
                        <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                            <span className="text-[10px] font-bold text-red-500/60 uppercase">Clear all results?</span>
                            <button
                                onClick={handleReset}
                                disabled={isResetting}
                                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-bold uppercase transition-all hover:bg-red-600 disabled:opacity-50"
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setShowConfirmReset(false)}
                                className="px-3 py-1.5 bg-foreground/5 hover:bg-foreground/10 text-foreground/60 rounded-lg text-[10px] font-bold uppercase transition-all"
                            >
                                No
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowConfirmReset(true)}
                            disabled={isResetting}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-all flex items-center gap-2 w-fit disabled:opacity-50"
                        >
                            {isResetting ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                                    Clearing...
                                </>
                            ) : (
                                "🗑️ Reset Results"
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Main Leaderboard */}
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                            {currentView === "models" ? "Model Leaderboard" : "Persona Leaderboard"}
                        </h2>
                        <p className="text-sm text-foreground/40">Aggregated from {data.length} completed run(s).</p>
                    </div>

                    <Leaderboard 
                        processedData={processedData}
                        selectedId={selectedId}
                        setSelectedId={setSelectedId}
                        currentView={currentView}
                        modelCapabilities={modelCapabilities}
                    />
                </div>

                {/* Drilldown View */}
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent opacity-0 select-none">
                            Spacer
                        </h2>
                        <p className="text-sm text-foreground/40 opacity-0 select-none">Spacer text.</p>
                    </div>

                    {selectedId && selectedStat ? (
                        <Drilldown selectedId={selectedId} stat={selectedStat} />
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 glass border border-dashed border-border/30 rounded-3xl text-center space-y-4 opacity-50">
                            <span className="text-4xl grayscale">🔍</span>
                            <p className="text-sm text-foreground/40">Select an item from the leaderboard to view its detailed breakdown.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

