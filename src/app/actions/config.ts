"use server";

import { db } from "@/../db";
import { agentConfigurations, backgroundJobs } from "@/../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getAgentConfigs() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    return db.select().from(agentConfigurations).where(eq(agentConfigurations.userId, session.user.id)).all();
}

export async function saveAgentConfig(data: { id?: string; name: string; model: string; systemPromptId?: string | null; systemPrompt?: string; temperature: number }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const now = new Date();
    if (data.id) {
        const result = db.update(agentConfigurations)
            .set({
                name: data.name,
                model: data.model,
                systemPromptId: data.systemPromptId,
                systemPrompt: data.systemPrompt || "You are a helpful coding assistant.",
                temperature: data.temperature,
                updatedAt: now,
            })
            .where(and(eq(agentConfigurations.id, data.id), eq(agentConfigurations.userId, session.user.id)))
            .returning()
            .get();
        revalidatePath("/agent");
        return result;
    } else {
        const result = db.insert(agentConfigurations)
            .values({
                userId: session.user.id,
                name: data.name,
                model: data.model,
                systemPromptId: data.systemPromptId,
                systemPrompt: data.systemPrompt || "You are a helpful coding assistant.",
                temperature: data.temperature,
                updatedAt: now,
            })
            .returning()
            .get();
        revalidatePath("/agent");
        return result;
    }
}

export async function deleteAgent(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    db.delete(agentConfigurations).where(and(eq(agentConfigurations.id, id), eq(agentConfigurations.userId, session.user.id))).run();
    revalidatePath("/agent");
}

export async function getBackgroundJobs() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    return db.select().from(backgroundJobs).orderBy(desc(backgroundJobs.startedAt)).limit(50).all();
}

export async function triggerRepositoryAnalysis() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { analyzeRepoDocs } = require("@/lib/analysis");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { runBackgroundJob } = require("@/lib/background-jobs");
    
    runBackgroundJob("repository_analysis_docs", async () => {
        await analyzeRepoDocs();
        return "Manual analysis complete";
    }).catch(console.error);
    
    revalidatePath("/admin/jobs");
    return { success: true };
}

export async function triggerRepositorySync() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { syncRepositories } = require("@/lib/sync");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { runBackgroundJob } = require("@/lib/background-jobs");
    
    runBackgroundJob("repository_sync", async () => {
        await syncRepositories();
        return "Manual sync complete";
    }).catch(console.error);
    
    revalidatePath("/admin/jobs");
    return { success: true };
}

export async function triggerSemanticIndexing() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { semanticIndexing } = require("@/lib/semanticIndexing");
    
    semanticIndexing().catch(console.error);
    
    revalidatePath("/admin/jobs");
    return { success: true };
}
