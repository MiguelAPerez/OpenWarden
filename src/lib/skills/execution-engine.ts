import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { Skill } from "@/types/agent";
import { trace, SpanStatusCode } from "@opentelemetry/api";

const execAsync = promisify(exec);
const tracer = trace.getTracer("skills-execution-engine");

export interface SkillExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    duration: number;
}

export async function executeSkill(
    skill: Skill,
    args: string[] = [],
    env: Record<string, string> = {}
): Promise<SkillExecutionResult> {
    return tracer.startActiveSpan("skill.execute", async (span) => {
        const startTime = Date.now();
        span.setAttributes({
            "skill.id": skill.id,
            "skill.name": skill.name,
            "skill.runtime": skill.runtime,
            "skill.args": JSON.stringify(args)
        });

        const skillPath = skill.isManaged 
            ? path.join(process.cwd(), "data", "system", "skills", skill.id)
            : path.join(process.cwd(), "data", skill.userId, "skills", skill.id);

        if (!skill.scriptFile) {
            const error = new Error(`Skill ${skill.id} has no execution script.`);
            span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            span.end();
            throw error;
        }

        const scriptPath = path.join(skillPath, skill.scriptFile);
        
        let command = "";
        const escapedArgs = args.map(a => `"${a.replace(/"/g, '\\"')}"`).join(" ");
        
        if (skill.scriptFile.endsWith(".py")) {
            command = `python3 "${scriptPath}" ${escapedArgs}`;
        } else if (skill.scriptFile.endsWith(".ts") || skill.scriptFile.endsWith(".js")) {
            const runner = skill.scriptFile.endsWith(".ts") ? "npx ts-node" : "node";
            command = `${runner} "${scriptPath}" ${escapedArgs}`;
        } else if (skill.scriptFile.endsWith(".php")) {
            command = `php "${scriptPath}" ${escapedArgs}`;
        } else if (skill.scriptFile.endsWith(".sh")) {
            command = `bash "${scriptPath}" ${escapedArgs}`;
        } else {
            const error = new Error(`Unsupported script type for skill ${skill.id}: ${skill.scriptFile}`);
            span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            span.end();
            throw error;
        }

        // Tunable timeout
        const timeoutMs = parseInt(process.env.SKILL_TIMEOUT || "30000"); // Default 30s
        span.setAttribute("skill.timeout", timeoutMs);

        try {
            if (skill.requirementsFile) {
                const depSpan = tracer.startSpan("skill.install_dependencies");
                try {
                    if (skill.requirementsFile === "env-requirements.txt") {
                        await execAsync(`pip install -r "${path.join(skillPath, skill.requirementsFile)}"`);
                    } else if (skill.requirementsFile === "package.json") {
                        await execAsync(`npm install --prefix "${skillPath}"`);
                    }
                    depSpan.end();
                } catch (depError) {
                    depSpan.setStatus({ code: SpanStatusCode.ERROR, message: String(depError) });
                    depSpan.end();
                }
            }

            const contextEnv: Record<string, string> = {
                ...process.env,
                ...env,
                USER_ID: skill.userId,
                REPO_IDS: env.REPO_IDS || "[]",
            };

            const { stdout, stderr } = await execAsync(command, {
                env: contextEnv as NodeJS.ProcessEnv,
                cwd: skillPath,
                timeout: timeoutMs,
            });

            const duration = Date.now() - startTime;
            span.setAttributes({
                "skill.duration": duration,
                "skill.exit_code": 0
            });

            return {
                stdout,
                stderr,
                exitCode: 0,
                duration,
            };
        } catch (error: unknown) {
            const duration = Date.now() - startTime;
            const err = error as { stdout?: string; stderr?: string; message?: string; code?: number | string; signal?: string };
            
            span.setStatus({ 
                code: SpanStatusCode.ERROR, 
                message: err.message || String(error) 
            });
            span.setAttributes({
                "skill.duration": duration,
                "skill.exit_code": typeof err.code === 'number' ? err.code : 1,
                "skill.timed_out": err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT'
            });

            return {
                stdout: err.stdout || "",
                stderr: err.stderr || err.message || String(error),
                exitCode: typeof err.code === 'number' ? err.code : 1,
                duration,
            };
        } finally {
            span.end();
        }
    });
}
