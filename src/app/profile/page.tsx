import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { UpdateProfileForm } from "@/components/UpdateProfileForm";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    return (
        <div className="max-w-2xl mx-auto px-4 py-20">
            <div className="glass p-8 rounded-2xl border border-border">
                <h1 className="text-3xl font-bold mb-1">User Profile</h1>
                <p className="text-foreground/50 mb-8">Manage your account details and security settings.</p>

                <UpdateProfileForm
                    userId={user?.id ?? ""}
                    initialName={user?.name ?? ""}
                    initialUsername={user?.username ?? ""}
                    initialEmail={user?.email ?? ""}
                />
            </div>
        </div>
    );
}
