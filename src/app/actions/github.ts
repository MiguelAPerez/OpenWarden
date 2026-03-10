"use server";

import { db } from "@/../db";
import { githubConfigurations } from "@/../db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { App } from "octokit";

export async function getGitHubConfigs() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const configs = db.select()
        .from(githubConfigurations)
        .where(eq(githubConfigurations.userId, session.user.id))
        .all();

    return configs.map(config => ({
        id: config.id,
        name: config.name,
        appId: config.appId,
        clientId: config.clientId,
        // Don't send full secret/key back to client normally, but for settings we might need to show presence
        hasSecret: !!config.clientSecret,
        hasPrivateKey: !!config.privateKey,
        installationId: config.installationId,
        updatedAt: config.updatedAt,
    }));
}

export async function saveGitHubConfig(data: {
    id?: string;
    name: string;
    appId: string;
    clientId: string;
    clientSecret: string;
    privateKey: string;
    installationId?: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const now = new Date();

    if (data.id) {
        // Update existing
        const result = db.update(githubConfigurations)
            .set({
                name: data.name,
                appId: data.appId,
                clientId: data.clientId,
                clientSecret: data.clientSecret,
                privateKey: data.privateKey,
                installationId: data.installationId || null,
                updatedAt: now,
            })
            .where(and(eq(githubConfigurations.id, data.id), eq(githubConfigurations.userId, session.user.id)))
            .returning()
            .get();
        return result;
    } else {
        // Create new
        const result = db.insert(githubConfigurations)
            .values({
                userId: session.user.id,
                name: data.name,
                appId: data.appId,
                clientId: data.clientId,
                clientSecret: data.clientSecret,
                privateKey: data.privateKey,
                installationId: data.installationId || null,
                updatedAt: now,
            })
            .returning()
            .get();
        return result;
    }
}

export async function deleteGitHubConfig(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    db.delete(githubConfigurations)
        .where(and(eq(githubConfigurations.id, id), eq(githubConfigurations.userId, session.user.id)))
        .run();

    return { success: true };
}

export async function testGitHubConnection(config: {
    appId: string;
    privateKey: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    try {
        const app = new App({
            appId: config.appId,
            privateKey: config.privateKey,
        });

        // Test by getting authenticated app info
        const { data } = await app.octokit.request("GET /app");

        if (!data) {
            throw new Error("Failed to retrieve app data from GitHub.");
        }

        // Also try to list installations to see if it's installed anywhere
        const { data: installations } = await app.octokit.request("GET /app/installations");

        return {
            success: true,
            app: {
                name: data.name,
                id: data.id,
                slug: data.slug,
            },
            installations: installations.map((i) => ({
                id: i.id,
                account: i.account?.login || "unknown",
                type: i.target_type || "organization",
            })),
        };
    } catch (error) {
        console.error("GitHub test connection error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to connect to GitHub. Please check your App ID and Private Key.",
        };
    }
}
