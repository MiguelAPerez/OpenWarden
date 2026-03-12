"use client";

import React from "react";

interface Repo {
    id: string;
    fullName: string;
}

interface WorkspaceTopBarProps {
    repos: Repo[];
    selectedRepoId: string;
    onSelectRepo: (id: string) => void;
    branches: string[];
    selectedBranch: string;
    onSelectBranch: (branch: string) => void;
    onCreateBranch: (name: string) => void;
}

export default function WorkspaceTopBar({
    repos,
    selectedRepoId,
    onSelectRepo,
    branches,
    selectedBranch,
    onSelectBranch,
    onCreateBranch
}: WorkspaceTopBarProps) {
    const [isCreatingBranch, setIsCreatingBranch] = React.useState(false);
    const [newBranchName, setNewBranchName] = React.useState("");

    const handleCreateBranch = () => {
        if (newBranchName.trim()) {
            onCreateBranch(newBranchName.trim());
            setNewBranchName("");
            setIsCreatingBranch(false);
        }
    };
    return (
        <div className="flex items-center gap-4 h-12 px-4 border-b border-border bg-background/50 backdrop-blur-md">
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground/70">Repository</label>
                <select
                    value={selectedRepoId}
                    onChange={(e) => onSelectRepo(e.target.value)}
                    className="p-1 px-2 text-sm bg-foreground/5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary w-48"
                >
                    <option value="">Select Repository...</option>
                    {repos.map(r => (
                        <option key={r.id} value={r.id}>{r.fullName}</option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground/70">Branch</label>
                {!isCreatingBranch ? (
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedBranch}
                            onChange={(e) => onSelectBranch(e.target.value)}
                            className="p-1 px-2 text-sm bg-foreground/5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary w-48"
                        >
                            {!selectedRepoId ? (
                                <option value="">[None]</option>
                            ) : branches.length === 0 ? (
                                <option value="">Loading...</option>
                            ) : null}
                            {branches.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                        {selectedRepoId && (
                            <button
                                onClick={() => setIsCreatingBranch(true)}
                                className="p-1 px-2 text-xs font-semibold bg-primary text-primary-foreground rounded hover:bg-primary/90"
                                title="Create new branch"
                            >
                                + New
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <input
                            autoFocus
                            type="text"
                            value={newBranchName}
                            onChange={(e) => setNewBranchName(e.target.value)}
                            placeholder="Branch name..."
                            className="p-1 px-2 text-sm bg-foreground/5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary w-32"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleCreateBranch();
                                if (e.key === "Escape") setIsCreatingBranch(false);
                            }}
                        />
                        <button
                            onClick={handleCreateBranch}
                            className="p-1 px-2 text-xs font-semibold bg-primary text-primary-foreground rounded hover:bg-primary/90"
                        >
                            Create
                        </button>
                        <button
                            onClick={() => setIsCreatingBranch(false)}
                            className="p-1 px-2 text-xs font-semibold bg-foreground/10 text-foreground rounded hover:bg-foreground/20"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
