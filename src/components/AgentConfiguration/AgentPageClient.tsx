"use client";

import React, { useState } from "react";
import { AgentConfigForm } from "./AgentConfigForm";
import { SkillsManager } from "@/components/AgentConfiguration/SkillsManager";
import { ToolsManager } from "@/components/AgentConfiguration/ToolsManager";
import { AgentConfig, Skill, Tool, SystemPrompt } from "@/types/agent";

export const AgentPageClient = ({
    configs,
    initialSkills,
    initialTools,
    systemPrompts
}: {
    configs: AgentConfig[];
    initialSkills: Skill[];
    initialTools: Tool[];
    systemPrompts: SystemPrompt[];
}) => {
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(configs[0]?.id || null);
    const [activeTab, setActiveTab] = useState("model");

    const selectedAgent = configs.find(c => c.id === selectedAgentId) || null;
    const agentSkills = initialSkills.filter(s => s.agentId === selectedAgentId);
    const agentTools = initialTools.filter(t => t.agentId === selectedAgentId);

    const tabs = [
        { id: "model", label: "Model & Prompt" },
        { id: "skills", label: "Skills" },
        { id: "tools", label: "Tools" },
    ];

    return (
            <div className="flex flex-col md:flex-row gap-8">
                {/* Agent Sidebar */}
                <div className="w-full md:w-64 space-y-4">
                    <button
                        onClick={() => {
                            setSelectedAgentId(null);
                            setActiveTab("model");
                        }}
                        className={`w-full px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${selectedAgentId === null
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                            }`}
                    >
                        + Create New Agent
                    </button>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-foreground/30 px-4">Your Agents</label>
                        {configs.map((agent) => (
                            <button
                                key={agent.id}
                                onClick={() => setSelectedAgentId(agent.id)}
                                className={`w-full px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${selectedAgentId === agent.id
                                    ? "bg-foreground text-background"
                                    : "text-foreground/60 hover:bg-foreground/5"
                                    }`}
                            >
                                {agent.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-8">
                    <div className="flex gap-1 p-1 bg-foreground/5 rounded-2xl w-fit border border-border/50">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                                    : "text-foreground/40 hover:text-foreground/60 hover:bg-foreground/5"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 transition-all animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {activeTab === "model" && (
                            <AgentConfigForm
                                initialConfig={selectedAgent}
                                systemPrompts={systemPrompts}
                            />
                        )}
                        {activeTab === "skills" && (
                            <SkillsManager
                                initialSkills={agentSkills}
                                agentId={selectedAgentId}
                            />
                        )}
                        {activeTab === "tools" && (
                            <ToolsManager
                                initialTools={agentTools}
                                agentId={selectedAgentId}
                            />
                        )}
                    </div>
                </div>
            </div>
    );
};
