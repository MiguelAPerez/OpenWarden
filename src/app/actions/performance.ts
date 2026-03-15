"use server";

import { db } from "@/../db";
import { agentConfigurations, benchmarkEntries } from "@/../db/schema";
import { eq, avg, count, and } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function getAgentPerformanceSummary() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    const agents = db.select().from(agentConfigurations).where(eq(agentConfigurations.userId, session.user.id)).all();
    
    const performanceSummaries = await Promise.all(agents.map(async (agent) => {
        // Find entries that match this agent's model and (optionally) systemPromptId
        const entries = db.select({
            avgScore: avg(benchmarkEntries.score).mapWith(Number),
            totalCount: count(benchmarkEntries.id),
        })
        .from(benchmarkEntries)
        .where(
            and(
                eq(benchmarkEntries.model, agent.model),
                agent.systemPromptId ? eq(benchmarkEntries.systemPromptId, agent.systemPromptId) : undefined
            )
        )
        .get();

        const latestEntry = db.select()
            .from(benchmarkEntries)
            .where(
                and(
                    eq(benchmarkEntries.model, agent.model),
                    agent.systemPromptId ? eq(benchmarkEntries.systemPromptId, agent.systemPromptId) : undefined,
                    eq(benchmarkEntries.status, "completed")
                )
            )
            .orderBy(benchmarkEntries.completedAt)
            .limit(1)
            .get();

        return {
            agentId: agent.id,
            agentName: agent.name,
            avgScore: entries?.avgScore || 0,
            totalBenchmarks: entries?.totalCount || 0,
            latestScore: latestEntry?.score || null,
            latestDuration: latestEntry?.duration || null,
            lastUpdated: latestEntry?.completedAt || null,
        };
    }));

    return performanceSummaries;
}
