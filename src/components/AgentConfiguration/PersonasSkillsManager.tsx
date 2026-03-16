import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSkill, deleteSkill, syncSystemSkills, importSkillFromRepo } from "@/app/actions/skills";
import { Skill } from "@/types/agent";

export const PersonasSkillsManager = ({
    initialSkills
}: {
    initialSkills: Skill[];
}) => {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [repoUrl, setRepoUrl] = useState("");
    const [editForm, setEditForm] = useState({
        name: "",
        description: "",
        content: "",
        scriptFile: "",
        scriptContent: "",
        requirementsFile: "",
        requirementsContent: ""
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await saveSkill({
                ...editForm,
                scriptFile: editForm.scriptFile || null,
                scriptContent: editForm.scriptContent || null,
                requirementsFile: editForm.requirementsFile || null,
                requirementsContent: editForm.requirementsContent || null,
                id: isEditing || undefined
            });
            setIsEditing(null);
            router.refresh();
        } catch {
            alert("Failed to save skill.");
        }
    };

    const handleSync = async () => {
        try {
            await syncSystemSkills();
            router.refresh();
        } catch {
            alert("Failed to sync system skills.");
        }
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await importSkillFromRepo(repoUrl);
            setIsImporting(false);
            setRepoUrl("");
            router.refresh();
        } catch {
            alert("Failed to import skill.");
        }
    };

    const startNew = () => {
        setIsEditing("");
        setEditForm({
            name: "",
            description: "",
            content: "",
            scriptFile: "index.ts",
            scriptContent: "export async function main() {\n  console.log('Hello from skill');\n}",
            requirementsFile: "",
            requirementsContent: ""
        });
    };

    const startEdit = (skill: Skill) => {
        setIsEditing(skill.id);
        setEditForm({
            name: skill.name,
            description: skill.description,
            content: skill.content,
            scriptFile: skill.scriptFile || "",
            scriptContent: skill.scriptContent || "",
            requirementsFile: skill.requirementsFile || "",
            requirementsContent: skill.requirementsContent || ""
        });
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this skill? This will remove it from all agents.")) {
            try {
                await deleteSkill(id);
                router.refresh();
            } catch {
                alert("Failed to delete skill.");
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold text-foreground/80">Skill Library</h2>
                    <p className="text-xs text-foreground/40 font-medium uppercase tracking-tight">Available capabilities for your AI agents</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSync}
                        className="px-4 py-2 bg-foreground/5 text-foreground/60 rounded-xl hover:bg-foreground/10 transition-all text-sm font-medium"
                    >
                        Sync System
                    </button>
                    <button
                        onClick={() => setIsImporting(true)}
                        className="px-4 py-2 bg-foreground/5 text-foreground/60 rounded-xl hover:bg-foreground/10 transition-all text-sm font-medium"
                    >
                        Import from Repo
                    </button>
                    <button
                        onClick={startNew}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all text-sm font-bold shadow-lg shadow-primary/20"
                    >
                        + New Skill
                    </button>
                </div>
            </div>

            {isImporting && (
                <div className="glass p-6 rounded-2xl border border-primary/30 animate-in fade-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleImport} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-foreground/40">Git Repository URL</label>
                            <input
                                className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={repoUrl}
                                onChange={e => setRepoUrl(e.target.value)}
                                placeholder="https://github.com/user/skill-repo.git"
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setIsImporting(false)} className="px-4 py-2 text-sm text-foreground/60">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold">Import</button>
                        </div>
                    </form>
                </div>
            )}

            {isEditing !== null && (
                <div className="glass p-6 rounded-2xl border border-primary/30 animate-in fade-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase text-foreground/40">Skill Name</label>
                                <input
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    placeholder="e.g., Stock Market Analyst"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase text-foreground/40">Short Description</label>
                                <input
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={editForm.description}
                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                    placeholder="Briefly describe what this skill does"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-foreground/40">Instructions (SKILL.md content)</label>
                            <textarea
                                className="w-full bg-background border border-border rounded-xl px-4 py-2 min-h-[120px] font-mono text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={editForm.content}
                                onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                                placeholder="# Skill Name\n\n## Description\nDetailed instructions..."
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/30">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase text-foreground/40">Script Filename (Optional)</label>
                                    <input
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm"
                                        value={editForm.scriptFile}
                                        onChange={e => setEditForm({ ...editForm, scriptFile: e.target.value })}
                                        placeholder="index.ts, index.py, etc."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase text-foreground/40">Script Content</label>
                                    <textarea
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2 min-h-[200px] font-mono text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        value={editForm.scriptContent}
                                        onChange={e => setEditForm({ ...editForm, scriptContent: e.target.value })}
                                        placeholder="Code execution entry point..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase text-foreground/40">Requirements Filename (Optional)</label>
                                    <input
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm"
                                        value={editForm.requirementsFile}
                                        onChange={e => setEditForm({ ...editForm, requirementsFile: e.target.value })}
                                        placeholder="env-requirements.txt, package.json"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase text-foreground/40">Requirements Content</label>
                                    <textarea
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2 min-h-[200px] font-mono text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        value={editForm.requirementsContent}
                                        onChange={e => setEditForm({ ...editForm, requirementsContent: e.target.value })}
                                        placeholder="pip install requirements or npm dependencies..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                            <button
                                type="button"
                                onClick={() => setIsEditing(null)}
                                className="px-4 py-2 text-sm text-foreground/60 hover:text-foreground font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all shadow-md shadow-primary/10"
                            >
                                Save Skill
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {initialSkills.map(skill => (
                    <div key={skill.id} className="glass p-5 rounded-2xl border border-border/50 hover:border-primary/40 transition-all group flex flex-col h-full bg-foreground/[0.02]">
                        <div className="flex justify-between items-start mb-3">
                            <div className="space-y-1">
                                <h3 className="font-bold text-foreground/80 group-hover:text-primary transition-colors">{skill.name}</h3>
                                {skill.isManaged ? (
                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">System</span>
                                ) : (
                                    <span className="text-[10px] bg-foreground/10 text-foreground/60 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">User</span>
                                )}
                            </div>
                            {!skill.isManaged && (
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => startEdit(skill)}
                                        className="p-1.5 bg-foreground/5 hover:bg-primary/10 hover:text-primary rounded-lg transition-all"
                                        title="Edit"
                                    >
                                        <span className="text-xs font-bold uppercase">Edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(skill.id)}
                                        className="p-1.5 bg-foreground/5 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all"
                                        title="Delete"
                                    >
                                        <span className="text-xs font-bold uppercase">Del</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-foreground/40 line-clamp-3 mb-4 flex-1">
                            {skill.description}
                        </p>
                        <div className="flex justify-between items-center pt-3 border-t border-border/30">
                            <div className="flex gap-2">
                                {skill.scriptFile && <span className="text-[10px] font-mono text-foreground/30">📜 {skill.scriptFile}</span>}
                                {skill.requirementsFile && <span className="text-[10px] font-mono text-foreground/30">📦 Deps</span>}
                            </div>
                            <span className="text-[10px] font-mono text-foreground/20">
                                {new Date(skill.updatedAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
