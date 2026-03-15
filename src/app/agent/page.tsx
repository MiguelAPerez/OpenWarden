import { getAgentConfigs, syncManagedAgents } from "@/app/actions/config";
import { getSkills } from "@/app/actions/skills";
import { getTools } from "@/app/actions/tools";
import { getSystemPrompts, syncManagedPersonas } from "@/app/actions/prompts";
import { getAgentPerformanceSummary } from "@/app/actions/performance";
import { AgentPageClient } from "@/components/AgentConfiguration/AgentPageClient";

import { getCachedRepositories, getRepoDataByFullName } from "@/app/actions/repositories";
import { SystemPrompt } from "@/types/agent";

export default async function AgentPage({
    searchParams: searchParamsPromise
}: {
    searchParams: Promise<{ repo?: string }>
}) {
    const searchParams = await searchParamsPromise;
    const allRepos = await getCachedRepositories();
    const configRepo = allRepos.find(r => r.isConfigRepository);
    const targetRepo = searchParams.repo || configRepo?.fullName;

    if (targetRepo) {
        try {
            const repoData = await getRepoDataByFullName(targetRepo, 'agent-config');
            
            // Sync personas first since agents depend on them
            if (repoData.personas.length > 0) {
                await syncManagedPersonas(repoData.personas as unknown as SystemPrompt[]);
            } else {
                await syncManagedPersonas([]); // Clear if none in repo
            }

            if (repoData.agents.length > 0) {
                await syncManagedAgents(repoData.agents);
            } else {
                await syncManagedAgents([]); // Clear if none in repo
            }
        } catch (error) {
            console.error("Failed to sync repo data:", error);
        }
    }

    // Load after sync (now contains both local and managed)
    const configs = await getAgentConfigs();
    const systemPrompts = await getSystemPrompts();

    const initialSkills = await getSkills();
    const initialTools = await getTools();
    const performanceSummaries = await getAgentPerformanceSummary();

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 animate-in fade-in duration-700">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/50">
                        Agents
                    </h1>
                    <p className="text-base text-foreground/40 max-w-2xl font-medium">
                        Monitor performance, configure settings, and manage personas for your AI workforce.
                    </p>
                </div>
            </div>

            <AgentPageClient
                configs={configs}
                initialSkills={initialSkills}
                initialTools={initialTools}
                systemPrompts={systemPrompts}
                performanceSummaries={performanceSummaries}
            />
        </div>
    );
}

