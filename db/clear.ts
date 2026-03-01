import { db } from "./index"
import { users, accounts, sessions, verificationTokens, permissions, userPermissions, giteaConfigurations } from "./schema"

async function clear() {
    console.log("🧹 Clearing database...")

    try {
        // Order matters if there are foreign key constraints without cascade (though schema has onDelete: "cascade")
        // We'll delete from junction/child tables first just to be safe, then the parents.

        console.log("- Clearing user permissions...")
        await db.delete(userPermissions)

        console.log("- Clearing Gitea configurations...")
        await db.delete(giteaConfigurations)

        console.log("- Clearing sessions...")
        await db.delete(sessions)

        console.log("- Clearing accounts...")
        await db.delete(accounts)

        console.log("- Clearing verification tokens...")
        await db.delete(verificationTokens)

        console.log("- Clearing users...")
        await db.delete(users)

        console.log("- Clearing permissions...")
        await db.delete(permissions)

        console.log("\n✅ Database cleared successfully!")
    } catch (error) {
        console.error("❌ Clearing failed:", error)
        process.exit(1)
    }
}

clear()
