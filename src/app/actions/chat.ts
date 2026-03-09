"use server";

import { db } from "@/../db";
import { agentConfigurations, skills, tools, repositories, systemPrompts, ollamaConfigurations } from "@/../db/schema";
import { eq, and, isNull, InferSelectModel } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getRepoFileContentInternal } from "./files";

// --- Types ---

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface ChatResponse {
    message: string;
    redirect: string | null;
}

// --- Classes ---

class ChatContext {
    constructor(
        public readonly userId: string,
        public readonly repoId: string,
        public readonly agentId?: string,
        public filePath: string | null = null
    ) { }

    async load() {
        const repo = db.select().from(repositories).where(eq(repositories.id, this.repoId)).get();
        if (!repo) throw new Error("Repository not found");

        let agentConfig;
        if (this.agentId) {
            agentConfig = db.select().from(agentConfigurations).where(and(eq(agentConfigurations.id, this.agentId), eq(agentConfigurations.userId, this.userId))).get();
        } else {
            agentConfig = db.select().from(agentConfigurations).where(eq(agentConfigurations.userId, this.userId)).get();
        }
        if (!agentConfig || !agentConfig.model) throw new Error("Agent not configured.");

        let personalityPrompt = agentConfig.systemPrompt;
        if (agentConfig.systemPromptId) {
            const personality = db.select().from(systemPrompts).where(eq(systemPrompts.id, agentConfig.systemPromptId)).get();
            if (personality) personalityPrompt = personality.content;
        }

        const enabledSkills = db.select().from(skills).where(and(
            eq(skills.userId, this.userId),
            eq(skills.isEnabled, true),
            this.agentId ? eq(skills.agentId, this.agentId) : isNull(skills.agentId)
        )).all();

        const enabledTools = db.select().from(tools).where(and(
            eq(tools.userId, this.userId),
            eq(tools.isEnabled, true),
            this.agentId ? eq(tools.agentId, this.agentId) : isNull(tools.agentId)
        )).all();

        const ollamaConfig = db.select().from(ollamaConfigurations).where(eq(ollamaConfigurations.userId, this.userId)).get();
        if (!ollamaConfig) throw new Error("Ollama not configured.");

        let fileContent = "";
        if (this.filePath) {
            try {
                fileContent = await getRepoFileContentInternal(this.repoId, this.filePath, this.userId);
                fileContent = fileContent.replace(/^---\s*[\s\S]*?---\s*/, '');
            } catch (e) {
                console.error("Error reading initial file content:", e);
            }
        }

        return {
            repo,
            agentConfig,
            personalityPrompt,
            enabledSkills,
            enabledTools,
            ollamaConfig,
            initialFileContent: fileContent
        };
    }
}

interface ContextData {
    repo: InferSelectModel<typeof repositories>;
    agentConfig: InferSelectModel<typeof agentConfigurations>;
    personalityPrompt: string | null;
    enabledSkills: InferSelectModel<typeof skills>[];
    enabledTools: InferSelectModel<typeof tools>[];
    ollamaConfig: InferSelectModel<typeof ollamaConfigurations>;
    initialFileContent: string;
}

class PromptBuilder {
    static buildSystemPrompt(contextData: ContextData, currentFilePath: string | null, currentFileContent: string) {
        const { repo, personalityPrompt, enabledSkills, enabledTools } = contextData;
        let prompt = personalityPrompt || "You are a helpful coding assistant.";

        if (enabledSkills.length > 0) {
            prompt += "\n\nAvailable Skills:\n" + enabledSkills.map((s) => `- ${s.name}: ${s.description}\n${s.content}`).join("\n\n");
        }

        if (enabledTools.length > 0) {
            prompt += "\n\nAvailable Tools:\n" + enabledTools.map((t) => `- ${t.name}: ${t.description}\nSchema: ${t.schema}`).join("\n\n");
        }

        prompt += `\n\nContext:\nRepository: ${repo.fullName}\n`;

        const docsMetadata = repo.docsMetadata ? JSON.parse(repo.docsMetadata) : {};
        const fileList = (docsMetadata.fileList || []) as { path: string; title?: string; description?: string }[];

        if (fileList.length > 0) {
            prompt += "\nAvailable Documentation Files:\n";
            prompt += fileList.map((f) => `- ${f.path}${f.title ? ` (${f.title})` : ""}${f.description ? `: ${f.description}` : ""}`).join("\n");
        }

        if (currentFilePath) {
            prompt += `\nCurrently viewed file: ${currentFilePath}\nContent:\n${currentFileContent}\n`;
        }

        prompt += `
CRITICAL INSTRUCTIONS:
1. Provide helpful answers based on the documentation provided.
2. If you identify a relevant file in the "Available Documentation Files" list that could help answer the user's question, you MUST navigate to it first using the "redirect" field.
3. DO NOT attempt to answer detailed questions based ONLY on the file titles or descriptions in the list. The descriptions are just summaries; the full details are inside the files.
4. "Read Before You Lead": If you haven't seen the full content of a relevant file yet, navigate to it, read it, and THEN provide your final answer in the subsequent turn.
5. Your FINAL response after gathering enough information should be helpful plain text (Markdown is encouraged). 
6. If you want to point the user to a specific file as your final recommendation, include the "redirect" field in your final JSON response.
7. JSON format for both intermediate navigation and final recommendations: {"message": "Your thoughts or final answer", "redirect": "path/to/file.md"}
8. ALWAYS respond with valid JSON if you use the "redirect" field.
`;
        return prompt;
    }
}

class OllamaClient {
    constructor(private readonly config: { url: string }, private readonly model: string, private readonly temperature: number) { }

    async chat(messages: ChatMessage[]): Promise<string> {
        const response = await fetch(`${this.config.url}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: this.model,
                messages,
                stream: false,
                options: { temperature: this.temperature / 100 }
            }),
        });

        if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);
        const data = await response.json();
        return data.message.content;
    }
}

class InferenceRunner {
    private finalRedirect: string | null;

    constructor(
        private readonly userId: string,
        private readonly repoId: string,
        private readonly contextData: ContextData,
        private readonly ollama: OllamaClient
    ) {
        this.finalRedirect = null;
    }

    async run(prompt: string, initialFilePath: string | null, initialFileContent: string): Promise<ChatResponse> {
        const messages: ChatMessage[] = [
            { role: "system", content: "" }, // Placeholder, will be updated in the loop
            { role: "user", content: prompt }
        ];

        let currentFilePath = initialFilePath;
        let currentFileContent = initialFileContent;
        let currentRedirect = initialFilePath;

        for (let step = 0; step < 3; step++) {
            console.log(`[Chat Inference] Step ${step + 1}/3...`);
            const systemPrompt = PromptBuilder.buildSystemPrompt(this.contextData, currentFilePath, currentFileContent);
            messages[0].content = systemPrompt; // Refresh system prompt with new context if navigated

            const content = await this.ollama.chat(messages);

            const jsonMatch = content.match(/\{[\s\S]*\}/);
            let parsed = null;
            if (jsonMatch) {
                try {
                    parsed = JSON.parse(jsonMatch[0]);
                } catch (e) {
                    console.warn("Found JSON-like content but failed to parse:", e);
                }
            }

            if (parsed) {
                if (parsed.redirect && step < 2) {
                    const newPath = parsed.redirect;
                    if (newPath !== currentFilePath) {
                        console.log(`[Chat Inference] Navigating to: ${newPath}`);
                        try {
                            const newContent = await getRepoFileContentInternal(this.repoId, newPath, this.userId);
                            const cleanedContent = newContent.replace(/^---\s*[\s\S]*?---\s*/, '');

                            messages.push({ role: "assistant", content });
                            messages.push({
                                role: "user",
                                content: `Observation: You are now seeing the FULL content of "${newPath}".\n\nContent:\n${cleanedContent}\n\nPlease provide your final answer based on this new information.`
                            });

                            currentFilePath = newPath;
                            currentFileContent = cleanedContent;
                            currentRedirect = newPath;
                            continue;
                        } catch (e) {
                            console.error(`Failed to navigate to ${newPath}:`, e);
                        }
                    }
                }

                return {
                    message: parsed.message || content,
                    redirect: parsed.redirect || currentRedirect
                };
            }

            return {
                message: content,
                redirect: currentRedirect
            };
        }

        throw new Error("Maximum inference steps reached.");
    }
}

// --- Public Actions ---

export async function chatWithDoc(repoId: string, filePath: string | null, prompt: string, agentId?: string): Promise<ChatResponse> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");
    return chatWithDocInternal(repoId, filePath, prompt, session.user.id, agentId);
}

export async function chatWithDocInternal(repoId: string, filePath: string | null, prompt: string, userId: string, agentId?: string): Promise<ChatResponse> {
    const context = new ChatContext(userId, repoId, agentId, filePath);
    const contextData = await context.load();

    const ollama = new OllamaClient(
        contextData.ollamaConfig,
        contextData.agentConfig.model!,
        contextData.agentConfig.temperature
    );

    const runner = new InferenceRunner(userId, repoId, contextData, ollama);

    return runner.run(prompt, filePath, contextData.initialFileContent);
}
