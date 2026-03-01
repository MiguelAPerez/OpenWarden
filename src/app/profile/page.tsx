import React from "react";

export default function ProfilePage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-20">
            <div className="glass p-8 rounded-2xl border border-border">
                <h1 className="text-3xl font-bold mb-4">User Profile</h1>
                <p className="text-foreground/60">This is a placeholder for the user profile page.</p>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-xl bg-foreground/5 border border-border">
                        <h2 className="text-lg font-semibold mb-2">Account Info</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-foreground/40 uppercase tracking-wider font-bold">Full Name</label>
                                <p className="text-foreground/80">Miguel Perez</p>
                            </div>
                            <div>
                                <label className="text-xs text-foreground/40 uppercase tracking-wider font-bold">Email Address</label>
                                <p className="text-foreground/80">miguel@example.com</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
