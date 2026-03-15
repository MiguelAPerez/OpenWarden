"use client";

import React, { useState, useEffect } from "react";
import { getSystemPromptsFromFiles, updateSystemPromptFile } from "@/app/actions/prompts";

export default function WorkmodeConfiguration() {
    const [prompts, setPrompts] = useState<{ name: string; content: string }[]>([]);
    const [selectedPrompt, setSelectedPrompt] = useState<string>("");
    const [content, setContent] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        async function loadPrompts() {
            try {
                const data = await getSystemPromptsFromFiles();
                setPrompts(data);
                if (data.length > 0) {
                    setSelectedPrompt(data[0].name);
                    setContent(data[0].content);
                }
            } catch (err) {
                console.error("Failed to load system prompts", err);
                setError("Failed to load system prompts from disk.");
            } finally {
                setIsLoading(false);
            }
        }
        loadPrompts();
    }, []);

    const handleSelectChange = (name: string) => {
        setSelectedPrompt(name);
        const prompt = prompts.find(p => p.name === name);
        if (prompt) {
            setContent(prompt.content);
        }
        setSuccess(null);
        setError(null);
    };

    const handleSave = async () => {
        if (!selectedPrompt) return;
        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            await updateSystemPromptFile(selectedPrompt, content);
            setSuccess(`Successfully updated ${selectedPrompt}.md`);
            // Update local state
            setPrompts(prev => prev.map(p => p.name === selectedPrompt ? { ...p, content } : p));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update prompt");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 rounded-xl bg-foreground/5 border border-border animate-pulse">
                <div className="h-6 w-48 bg-foreground/10 rounded mb-4"></div>
                <div className="h-4 w-full bg-foreground/10 rounded mb-6"></div>
                <div className="h-10 w-full bg-foreground/10 rounded mb-4"></div>
                <div className="h-40 w-full bg-foreground/10 rounded"></div>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-xl bg-foreground/5 border border-border">
            <h2 className="text-lg font-semibold mb-2">Workmode Configuration</h2>
            <p className="text-sm text-foreground/60 mb-6">
                Edit the system prompts that define the behavior of the agent in different work modes. These files are stored in <code>data/system/</code>.
            </p>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm">
                    {success}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground/70">
                        Select Workmode Prompt
                    </label>
                    <select
                        value={selectedPrompt}
                        onChange={(e) => handleSelectChange(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                    >
                        {prompts.map(p => (
                            <option key={p.name} value={p.name}>{p.name}.md</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground/70">
                        Content (Markdown)
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-64 px-4 py-3 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm transition-all duration-200 resize-none"
                        spellCheck={false}
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !selectedPrompt}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
                    >
                        {isSaving ? "Saving..." : "Save Prompt"}
                    </button>
                </div>
            </div>
        </div>
    );
}
