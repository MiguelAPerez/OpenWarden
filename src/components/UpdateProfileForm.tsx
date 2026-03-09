"use client";

import React, { useState } from "react";
import { updateProfile } from "@/app/actions/auth";

type Status = { type: "success" | "error"; message: string } | null;

interface UpdateProfileFormProps {
    initialName: string;
    initialUsername: string;
    initialEmail: string;
    userId: string;
}

export function UpdateProfileForm({ initialName, initialUsername, initialEmail, userId }: UpdateProfileFormProps) {

    // Account info state
    const [name, setName] = useState(initialName);
    const [email, setEmail] = useState(initialEmail);
    const [infoStatus, setInfoStatus] = useState<Status>(null);
    const [infoLoading, setInfoLoading] = useState(false);

    // Username state
    const [username, setUsername] = useState(initialUsername);
    const [usernameStatus, setUsernameStatus] = useState<Status>(null);
    const [usernameLoading, setUsernameLoading] = useState(false);

    // Password state
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordStatus, setPasswordStatus] = useState<Status>(null);
    const [passwordLoading, setPasswordLoading] = useState(false);

    async function handleInfoSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!userId) return;
        setInfoLoading(true);
        setInfoStatus(null);

        const result = await updateProfile(userId, { name: name.trim(), email: email.trim() });

        if (result.error) {
            setInfoStatus({ type: "error", message: result.error });
        } else {
            setInfoStatus({ type: "success", message: "Account info updated successfully!" });
        }
        setInfoLoading(false);
    }

    async function handleUsernameSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!userId) return;
        setUsernameLoading(true);
        setUsernameStatus(null);

        const result = await updateProfile(userId, { username: username.trim() });

        if (result.error) {
            setUsernameStatus({ type: "error", message: result.error });
        } else {
            setUsernameStatus({ type: "success", message: "Username updated successfully!" });
        }
        setUsernameLoading(false);
    }

    async function handlePasswordSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setPasswordStatus({ type: "error", message: "Passwords do not match." });
            return;
        }

        setPasswordLoading(true);
        setPasswordStatus(null);

        const result = await updateProfile(userId, { newPassword });

        if (result.error) {
            setPasswordStatus({ type: "error", message: result.error });
        } else {
            setPasswordStatus({ type: "success", message: "Password updated successfully!" });
            setNewPassword("");
            setConfirmPassword("");
        }
        setPasswordLoading(false);
    }

    return (
        <div className="space-y-6">
            {/* Account Info */}
            <div className="p-6 rounded-xl bg-foreground/5 border border-border">
                <h2 className="text-lg font-semibold mb-1">Account Info</h2>
                <p className="text-sm text-foreground/50 mb-4">Update your full name and email address.</p>
                <form onSubmit={handleInfoSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="full-name" className="block text-xs text-foreground/40 uppercase tracking-wider font-bold mb-1.5">
                            Full Name
                        </label>
                        <input
                            id="full-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your full name"
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-xs text-foreground/40 uppercase tracking-wider font-bold mb-1.5">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                            required
                        />
                    </div>

                    {infoStatus && (
                        <p className={`text-sm px-3 py-2 rounded-lg ${infoStatus.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                            {infoStatus.message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={infoLoading}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {infoLoading ? "Saving…" : "Save Info"}
                    </button>
                </form>
            </div>

            {/* Update Username */}
            <div className="p-6 rounded-xl bg-foreground/5 border border-border">
                <h2 className="text-lg font-semibold mb-1">Update Username</h2>
                <p className="text-sm text-foreground/50 mb-4">Change the username used to identify your account.</p>
                <form onSubmit={handleUsernameSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-xs text-foreground/40 uppercase tracking-wider font-bold mb-1.5">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter new username"
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                            required
                            minLength={3}
                        />
                    </div>

                    {usernameStatus && (
                        <p className={`text-sm px-3 py-2 rounded-lg ${usernameStatus.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                            {usernameStatus.message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={usernameLoading}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {usernameLoading ? "Saving…" : "Save Username"}
                    </button>
                </form>
            </div>

            {/* Update Password */}
            <div className="p-6 rounded-xl bg-foreground/5 border border-border">
                <h2 className="text-lg font-semibold mb-1">Change Password</h2>
                <p className="text-sm text-foreground/50 mb-4">Enter a new password and confirm it below.</p>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="new-password" className="block text-xs text-foreground/40 uppercase tracking-wider font-bold mb-1.5">
                            New Password
                        </label>
                        <input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min. 8 characters"
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                            required
                            minLength={8}
                        />
                    </div>

                    <div>
                        <label htmlFor="confirm-password" className="block text-xs text-foreground/40 uppercase tracking-wider font-bold mb-1.5">
                            Confirm New Password
                        </label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                            required
                            minLength={8}
                        />
                    </div>

                    {passwordStatus && (
                        <p className={`text-sm px-3 py-2 rounded-lg ${passwordStatus.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                            {passwordStatus.message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={passwordLoading}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {passwordLoading ? "Updating…" : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
