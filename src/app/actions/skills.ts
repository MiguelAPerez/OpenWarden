"use server";

import { db } from "@/../db";
import { skills } from "@/../db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getSkills(agentId?: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    if (agentId) {
        return db.select().from(skills).where(and(eq(skills.userId, session.user.id), eq(skills.agentId, agentId))).all();
    }

    return db.select().from(skills).where(eq(skills.userId, session.user.id)).all();
}

export async function saveSkill(data: { id?: string; agentId?: string | null; name: string; description: string; content: string; isEnabled: boolean }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const now = new Date();
    if (data.id) {
        db.update(skills)
            .set({
                agentId: data.agentId,
                name: data.name,
                description: data.description,
                content: data.content,
                isEnabled: data.isEnabled,
                updatedAt: now,
            })
            .where(and(eq(skills.id, data.id), eq(skills.userId, session.user.id)))
            .run();
    } else {
        db.insert(skills)
            .values({
                userId: session.user.id,
                agentId: data.agentId,
                name: data.name,
                description: data.description,
                content: data.content,
                isEnabled: data.isEnabled,
                updatedAt: now,
            })
            .run();
    }

    revalidatePath("/agent");
}

export async function deleteSkill(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    db.delete(skills).where(eq(skills.id, id)).run();
    revalidatePath("/agent");
}
