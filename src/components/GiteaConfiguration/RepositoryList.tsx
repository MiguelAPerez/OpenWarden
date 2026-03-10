"use client";

import React, { useState, useTransition } from "react";
import RepositoryCard from "./RepositoryCard";
import { toggleRepositoryEnabled } from "@/app/actions/repositories";

interface Repository {
    id: string;
    source: string;
    fullName: string;
    description: string | null;
    url: string;
    stars: number | null;
    forks: number | null;
    language: string | null;
    topics: string | null;
    docsMetadata: Record<string, unknown>;
    agentMetadata: Record<string, unknown>;
    enabled: boolean;
}

export default function RepositoryList({ initialRepos }: { initialRepos: Repository[] }) {
    const [search, setSearch] = useState("");
    const [sourceFilter, setSourceFilter] = useState<string>("all");
    const [showOnlyEnabled, setShowOnlyEnabled] = useState(() =>
        initialRepos.some((r) => r.enabled)
    );
    const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(initialRepos.map((r) => [r.id, r.enabled]))
    );
    const [, startTransition] = useTransition();

    const handleToggle = (id: string, newEnabled: boolean) => {
        // Optimistic update
        setEnabledMap((prev) => {
            const next = { ...prev, [id]: newEnabled };
            // Auto-toggle filter based on enabled count
            const enabledCount = Object.values(next).filter(Boolean).length;
            if (enabledCount === 0 && showOnlyEnabled) {
                setShowOnlyEnabled(false);
            } else if (enabledCount > 0 && !showOnlyEnabled && newEnabled) {
                // If we just enabled the first one, or enabled one while filter was off,
                // maybe we want to turn it on? The prompt says "have it on if one or more repos has been enabled"
                setShowOnlyEnabled(true);
            }
            return next;
        });
        startTransition(async () => {
            try {
                await toggleRepositoryEnabled(id, newEnabled);
            } catch {
                // Revert on error
                setEnabledMap((prev) => ({ ...prev, [id]: !newEnabled }));
            }
        });
    };

    const repos = initialRepos.map((r) => ({ ...r, enabled: enabledMap[r.id] ?? r.enabled }));

    const filteredRepos = repos.filter((repo) => {
        const matchesSearch =
            repo.fullName.toLowerCase().includes(search.toLowerCase()) ||
            (repo.description?.toLowerCase() || "").includes(search.toLowerCase());
        const matchesSource = sourceFilter === "all" || repo.source === sourceFilter;
        const matchesEnabled = !showOnlyEnabled || repo.enabled;
        return matchesSearch && matchesSource && matchesEnabled;
    });

    const sources = Array.from(new Set(initialRepos.map((r) => r.source)));

    const enabledCount = Object.values(enabledMap).filter(Boolean).length;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <input
                        type="text"
                        placeholder="Search repositories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-foreground/5 border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                    />
                    <svg className="absolute left-3.5 top-3 w-4 h-4 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full md:w-auto">
                    <button
                        onClick={() => setSourceFilter("all")}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border ${sourceFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-foreground/5 text-foreground/60 border-border hover:border-primary/30"}`}
                    >
                        All Sources
                    </button>
                    {sources.map((source) => (
                        <button
                            key={source}
                            onClick={() => setSourceFilter(source)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border capitalize ${sourceFilter === source ? "bg-primary text-primary-foreground border-primary" : "bg-foreground/5 text-foreground/60 border-border hover:border-primary/30"}`}
                        >
                            {source}
                        </button>
                    ))}
                    
                    <div className="h-6 w-px bg-border mx-2 hidden md:block" />

                    <button
                        onClick={() => setShowOnlyEnabled(!showOnlyEnabled)}
                        disabled={enabledCount === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border whitespace-nowrap ${
                            showOnlyEnabled 
                                ? "bg-primary/10 text-primary border-primary/30" 
                                : "bg-foreground/5 text-foreground/60 border-border hover:border-primary/30"
                        } ${enabledCount === 0 ? "opacity-50 cursor-not-allowed grayscale" : ""}`}
                    >
                        <span className={showOnlyEnabled ? "text-primary" : "text-foreground/40"}>
                            {showOnlyEnabled ? "👁️" : "👁️‍🗨️"}
                        </span>
                        Enabled Only
                    </button>

                    <span className="ml-2 text-xs text-foreground/40 whitespace-nowrap">
                        {enabledCount} / {initialRepos.length} enabled
                    </span>
                </div>
            </div>

            {filteredRepos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRepos.map((repo) => (
                        <RepositoryCard key={repo.id} repo={repo} onToggle={handleToggle} />
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center glass rounded-2xl border border-dashed border-border">
                    <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                        <span className="text-2xl">🔍</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">No repositories found</h3>
                    <p className="text-foreground/40">Try adjusting your filters or search terms.</p>
                </div>
            )}
        </div>
    );
}
