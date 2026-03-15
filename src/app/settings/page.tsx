"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import GiteaConfiguration from "@/components/SystemSettings/GiteaConfiguration";
import OllamaConfiguration from "@/components/SystemSettings/OllamaConfiguration";
import GitHubConfiguration from "@/components/SystemSettings/GitHubConfiguration";
import ClaudeConfiguration from "@/components/SystemSettings/ClaudeConfiguration";
import GoogleConfiguration from "@/components/SystemSettings/GoogleConfiguration";
import RepositoriesConfiguration from "@/components/SystemSettings/RepositoriesConfiguration";

import DockerConfiguration from "@/components/SystemSettings/DockerConfiguration";
import WorkmodeConfiguration from "@/components/SystemSettings/WorkmodeConfiguration";
import { getBranchProtection, updateBranchProtection } from "@/app/actions/settings";
import { useState, useEffect } from "react";

export default function SettingsPage() {
    const { theme, toggleTheme, mounted } = useTheme();
    const [isMainProtected, setIsMainProtected] = useState<boolean | null>(null);

    useEffect(() => {
        async function load() {
            const protection = await getBranchProtection();
            setIsMainProtected(protection);
        }
        load();
    }, []);

    const handleToggleProtection = async () => {
        if (isMainProtected === null) return;
        const newValue = !isMainProtected;
        setIsMainProtected(newValue);
        await updateBranchProtection(newValue);
    };

    // Match the SSR default to avoid hydration mismatch
    const displayTheme = mounted ? theme : "dark";

    return (
        <div className="max-w-7xl mx-auto px-4 py-20">
            <div className="flex flex-col lg:flex-row gap-12">
                {/* Sidebar Navigation */}
                <aside className="lg:w-64 flex-shrink-0">
                    <div className="sticky top-24 space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/40">Settings</h1>
                            <p className="text-sm text-foreground/50">Manage your system & preferences.</p>
                        </div>
                        
                        <nav className="flex flex-col gap-1">
                            {[
                                { id: "preferences", label: "Preferences", icon: "⚙️" },
                                { id: "ai-providers", label: "AI Providers", icon: "🤖" },
                                { id: "git-providers", label: "Git Providers", icon: "🐙" },
                                { id: "system-data", label: "System & Data", icon: "💾" },
                            ].map((item) => (
                                <a
                                    key={item.id}
                                    href={`#${item.id}`}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-foreground/5 text-foreground/60 hover:text-foreground transition-all duration-200 group border border-transparent hover:border-border/50"
                                >
                                    <span className="text-lg group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                                    <span className="font-medium">{item.label}</span>
                                </a>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-grow space-y-24">
                    {/* Preferences Group */}
                    <section id="preferences" className="scroll-mt-24">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <span className="text-primary text-xl">⚙️</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Preferences</h2>
                                <p className="text-sm text-foreground/40 text-pretty">General application settings and accessibility.</p>
                            </div>
                        </div>
                        <div className="p-6 rounded-2xl bg-foreground/5 border border-border space-y-4 shadow-sm">
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <p className="font-medium text-lg text-pretty">Dark Mode</p>
                                    <p className="text-sm text-foreground/40 text-pretty">Use the dark theme for the interface.</p>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    disabled={!mounted}
                                    className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${displayTheme === "dark" ? "bg-primary" : "bg-foreground/10"} ${!mounted ? "opacity-50 cursor-wait" : ""}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${displayTheme === "dark" ? "right-1" : "left-1"}`}></div>
                                </button>
                            </div>
                            <div className="flex items-center justify-between py-2 border-t border-border/50">
                                <div>
                                    <p className="font-medium text-lg text-pretty">Main Branch Protection</p>
                                    <p className="text-sm text-foreground/40 text-pretty">Disable terminal and git actions on main branch.</p>
                                </div>
                                <button
                                    onClick={handleToggleProtection}
                                    disabled={isMainProtected === null}
                                    className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${isMainProtected ? "bg-primary" : "bg-foreground/10"} ${isMainProtected === null ? "opacity-50 cursor-wait" : ""}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${isMainProtected ? "right-1" : "left-1"}`}></div>
                                </button>
                            </div>
                            <div className="flex items-center justify-between py-2 border-t border-border/50">
                                <div>
                                    <p className="font-medium text-lg text-pretty">Email Notifications</p>
                                    <p className="text-sm text-foreground/40 text-pretty">Receive updates via email.</p>
                                </div>
                                <div className="w-12 h-6 bg-foreground/10 rounded-full relative opacity-50 cursor-not-allowed text-center">
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-foreground/40 rounded-full shadow-sm"></div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* AI Providers Group */}
                    <section id="ai-providers" className="scroll-mt-24">
                         <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <span className="text-indigo-500 text-xl">🤖</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">AI Providers</h2>
                                <p className="text-sm text-foreground/40 text-pretty">Configure LLM providers and models.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <OllamaConfiguration />
                            <ClaudeConfiguration />
                            <GoogleConfiguration />
                        </div>
                    </section>

                    {/* Git Providers Group */}
                    <section id="git-providers" className="scroll-mt-24">
                         <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                <span className="text-orange-500 text-xl">🐙</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Git Providers</h2>
                                <p className="text-sm text-foreground/40 text-pretty">Connect to version control platforms.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <GitHubConfiguration />
                            <GiteaConfiguration />
                        </div>
                    </section>

                    {/* System & Data Group */}
                    <section id="system-data" className="scroll-mt-24">
                         <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <span className="text-emerald-500 text-xl">💾</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">System & Data</h2>
                                <p className="text-sm text-foreground/40 text-pretty">Infrastructure, workspaces, and system behavior.</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <RepositoriesConfiguration />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <DockerConfiguration />
                                <WorkmodeConfiguration />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
