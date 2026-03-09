import React, { useState, useEffect } from "react";
import { saveAgentConfig, deleteAgent } from "@/app/actions/config";
import { getOllamaModels } from "@/app/actions/ollama";
import { AgentConfig, SystemPrompt } from "@/types/agent";

export const AgentConfigForm = ({
    initialConfig,
    systemPrompts
}: {
    initialConfig: AgentConfig | null,
    systemPrompts: SystemPrompt[]
}) => {
    const [name, setName] = useState(initialConfig?.name || "");
    const [model, setModel] = useState(initialConfig?.model || "");
    const [systemPromptId, setSystemPromptId] = useState(initialConfig?.systemPromptId || "");
    const [temperature, setTemperature] = useState(initialConfig?.temperature || 70);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [message, setMessage] = useState("");
    const [ollamaModels, setOllamaModels] = useState<string[]>([]);

    useEffect(() => {
        setName(initialConfig?.name || "");
        setModel(initialConfig?.model || "");
        setSystemPromptId(initialConfig?.systemPromptId || "");
        setTemperature(initialConfig?.temperature || 70);
        setMessage("");
    }, [initialConfig]);

    useEffect(() => {
        async function loadOllamaModels() {
            try {
                const models = await getOllamaModels();
                setOllamaModels(models.map(m => m.name));
            } catch (err) {
                console.error("Failed to load Ollama models", err);
            }
        }
        loadOllamaModels();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage("");
        try {
            await saveAgentConfig({
                id: initialConfig?.id,
                name,
                model,
                systemPromptId: systemPromptId || null,
                temperature
            });
            setMessage("Configuration saved successfully!");
            if (!initialConfig) {
                window.location.reload();
            }
        } catch {
            setMessage("Failed to save configuration.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!initialConfig?.id) return;
        if (!confirm("Are you sure you want to delete this agent? Everything associated with it will be lost.")) return;

        setIsDeleting(true);
        try {
            await deleteAgent(initialConfig.id);
            window.location.reload();
        } catch {
            alert("Failed to delete agent.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-6 max-w-2xl animate-in fade-in duration-500">
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/70">Agent Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g., Production Assistant"
                    required
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/70">Model</label>
                    <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        required
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                    >
                        <option value="" disabled>Select a model...</option>
                        {ollamaModels.length > 0 && (
                            <optgroup label="Local (Ollama)">
                                {ollamaModels.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </optgroup>
                        )}
                        <optgroup label="Cloud Models (Coming Soon)">
                            <option value="gpt-4" disabled>GPT-4</option>
                        </optgroup>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/70">Personality</label>
                    <select
                        value={systemPromptId}
                        onChange={(e) => setSystemPromptId(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                    >
                        <option value="">Default Instructions</option>
                        {systemPrompts.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-sm font-medium text-foreground/70">Temperature</label>
                    <span className="text-sm text-primary font-mono">{(temperature / 100).toFixed(1)}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="200"
                    step="10"
                    value={temperature}
                    onChange={(e) => setTemperature(parseInt(e.target.value))}
                    className="w-full accent-primary bg-foreground/10 h-2 rounded-lg appearance-none cursor-pointer"
                />
            </div>

            <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={isSaving || isDeleting}
                        className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                        {isSaving ? "Saving..." : initialConfig ? "Save Changes" : "Create Agent"}
                    </button>
                    {message && <p className={`text-sm ${message.includes("success") ? "text-green-500" : "text-red-500"} animate-in fade-in duration-300`}>{message}</p>}
                </div>

                {initialConfig && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isSaving || isDeleting}
                        className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                    >
                        {isDeleting ? "Deleting..." : "Delete Agent"}
                    </button>
                )}
            </div>
        </form>
    );
};
