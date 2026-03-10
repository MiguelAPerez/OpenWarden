"use client";

import React, { useState, useEffect } from "react";
import { getGitHubConfigs, saveGitHubConfig, deleteGitHubConfig, testGitHubConnection } from "@/app/actions/github";

interface GitHubConfig {
    id: string;
    name: string;
    appId: string;
    clientId: string;
    hasSecret: boolean;
    hasPrivateKey: boolean;
    installationId?: string | null;
    updatedAt: Date;
}

export default function GitHubConfiguration() {
    const [configs, setConfigs] = useState<GitHubConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingConfig, setEditingConfig] = useState<Partial<GitHubConfig> | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        appId: "",
        clientId: "",
        clientSecret: "",
        privateKey: "",
        installationId: "",
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{
        success: boolean;
        app?: { name: string; id: number; slug?: string };
        installations?: { id: number; account: string; type: string }[];
        error?: string;
    } | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        try {
            const data = await getGitHubConfigs();
            setConfigs(data as unknown as GitHubConfig[]);
        } catch (err) {
            console.error("Failed to load GitHub configs", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            await saveGitHubConfig({
                id: editingConfig?.id,
                ...formData
            });
            await loadConfigs();
            setIsAdding(false);
            setEditingConfig(null);
            setFormData({
                name: "",
                appId: "",
                clientId: "",
                clientSecret: "",
                privateKey: "",
                installationId: "",
            });
        } catch {
            setError("Failed to save configuration.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this configuration?")) return;
        try {
            await deleteGitHubConfig(id);
            await loadConfigs();
        } catch {
            setError("Failed to delete configuration.");
        }
    };

    const handleTest = async () => {
        if (!formData.appId || !formData.privateKey) {
            setError("App ID and Private Key are required to test connection.");
            return;
        }

        setIsTesting(true);
        setError(null);
        setTestResult(null);

        try {
            const result = await testGitHubConnection({
                appId: formData.appId,
                privateKey: formData.privateKey,
            });
            setTestResult(result);
            if (!result.success) {
                setError(result.error || "Connection test failed.");
            }
        } catch {
            setError("An error occurred during connection test.");
        } finally {
            setIsTesting(false);
        }
    };

    if (isLoading) return <div className="p-6">Loading GitHub configurations...</div>;

    return (
        <div className="p-6 rounded-xl bg-foreground/5 border border-border">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">GitHub App Configurations</h2>
                {!isAdding && (
                    <button
                        onClick={() => {
                            setIsAdding(true);
                            setEditingConfig(null);
                            setFormData({
                                name: "",
                                appId: "",
                                clientId: "",
                                clientSecret: "",
                                privateKey: "",
                                installationId: "",
                            });
                        }}
                        className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/20 hover:bg-primary/20 transition-all"
                    >
                        + Add New App
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                    {error}
                </div>
            )}

            {testResult?.success && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm">
                    <p className="font-bold mb-1">Connection Successful!</p>
                    <p>App: {testResult.app?.name} ({testResult.app?.slug})</p>
                    <p>Installations: {testResult.installations?.length || 0}</p>
                </div>
            )}

            {(isAdding || editingConfig) ? (
                <form onSubmit={handleSave} className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="github-name" className="block text-xs font-bold uppercase tracking-wider text-foreground/40 mb-1.5">Config Name</label>
                            <input
                                id="github-name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="My GitHub App"
                                className="w-full px-4 py-2 rounded-lg bg-background border border-border text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="github-appId" className="block text-xs font-bold uppercase tracking-wider text-foreground/40 mb-1.5">App ID</label>
                            <input
                                id="github-appId"
                                value={formData.appId}
                                onChange={e => setFormData({ ...formData, appId: e.target.value })}
                                placeholder="123456"
                                className="w-full px-4 py-2 rounded-lg bg-background border border-border text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="github-clientId" className="block text-xs font-bold uppercase tracking-wider text-foreground/40 mb-1.5">Client ID</label>
                            <input
                                id="github-clientId"
                                value={formData.clientId}
                                onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                                placeholder="Iv1.xxxx"
                                className="w-full px-4 py-2 rounded-lg bg-background border border-border text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="github-clientSecret" className="block text-xs font-bold uppercase tracking-wider text-foreground/40 mb-1.5">Client Secret</label>
                            <input
                                id="github-clientSecret"
                                type="password"
                                value={formData.clientSecret}
                                onChange={e => setFormData({ ...formData, clientSecret: e.target.value })}
                                placeholder="••••••••"
                                className="w-full px-4 py-2 rounded-lg bg-background border border-border text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="github-privateKey" className="block text-xs font-bold uppercase tracking-wider text-foreground/40 mb-1.5">Private Key (PEM)</label>
                        <textarea
                            id="github-privateKey"
                            value={formData.privateKey}
                            onChange={e => setFormData({ ...formData, privateKey: e.target.value })}
                            placeholder="-----BEGIN RSA PRIVATE KEY-----..."
                            className="w-full px-4 py-2 rounded-lg bg-background border border-border text-[11px] font-mono h-32"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="github-installationId" className="block text-xs font-bold uppercase tracking-wider text-foreground/40 mb-1.5">Installation ID (Optional)</label>
                        <input
                            id="github-installationId"
                            value={formData.installationId}
                            onChange={e => setFormData({ ...formData, installationId: e.target.value })}
                            placeholder="Optional: Specify a single installation"
                            className="w-full px-4 py-2 rounded-lg bg-background border border-border text-sm"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={() => { setIsAdding(false); setEditingConfig(null); }}
                            className="px-4 py-2 text-sm font-medium hover:bg-foreground/5 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleTest}
                            disabled={isTesting}
                            className="px-4 py-2 bg-foreground/5 text-sm font-medium rounded-lg hover:bg-foreground/10"
                        >
                            {isTesting ? "Testing..." : "Test Connection"}
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg shadow-sm"
                        >
                            {isSaving ? "Saving..." : "Save Config"}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-4">
                    {configs.length === 0 ? (
                        <p className="text-sm text-foreground/40 italic">No GitHub Apps configured yet.</p>
                    ) : (
                        configs.map(config => (
                            <div key={config.id} className="p-4 rounded-xl border border-border bg-foreground/2 flex items-center justify-between group">
                                <div>
                                    <h3 className="font-bold text-sm">{config.name}</h3>
                                    <div className="flex gap-4 mt-1">
                                        <p className="text-[10px] text-foreground/40">App ID: {config.appId}</p>
                                        <p className="text-[10px] text-foreground/40">Client ID: {config.clientId}</p>
                                        <p className="text-[10px] text-foreground/40 text-right">
                                            Last saved: {new Date(config.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            setEditingConfig(config);
                                            setFormData({
                                                name: config.name,
                                                appId: config.appId,
                                                clientId: config.clientId,
                                                clientSecret: "", // Never pre-fill secret
                                                privateKey: "", // Never pre-fill key
                                                installationId: config.installationId || "",
                                            });
                                        }}
                                        className="p-1.5 text-foreground/60 hover:text-primary transition-colors"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(config.id)}
                                        className="p-1.5 text-foreground/60 hover:text-red-500 transition-colors"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
