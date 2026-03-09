import React from "react";
import { getAgentConfigs } from "@/app/actions/config";
import { getSkills } from "@/app/actions/skills";
import { getTools } from "@/app/actions/tools";
import { getSystemPrompts } from "@/app/actions/prompts";
import { AgentPageClient } from "@/components/AgentConfiguration/AgentPageClient";

export default async function AgentPage() {
    const configs = await getAgentConfigs();
    const initialSkills = await getSkills();
    const initialTools = await getTools();
    const systemPrompts = await getSystemPrompts();

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 animate-in fade-in duration-700">
            <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
                    Agent Configuration
                </h1>
                <p className="text-lg text-foreground/40 max-w-2xl">
                    Configure your AI agents&apos; personalities, skills, and tools to tailor their behavior.
                </p>

            </div>

            <AgentPageClient
                configs={configs}
                initialSkills={initialSkills}
                initialTools={initialTools}
                systemPrompts={systemPrompts}
            />
        </div>
    );
}

