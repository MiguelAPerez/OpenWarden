"use server"

import { db } from "@/../db"
import { users } from "@/../db/schema"
import { eq } from "drizzle-orm"
import bcryptjs from "bcryptjs"

export async function registerUser(formData: FormData) {
    const name = formData.get("name") as string
    const username = formData.get("username") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !username || !password || !name) {
        return { error: "Missing required fields." }
    }

    // Check if user exists by email or username
    const existingEmailUser = await db.select().from(users).where(eq(users.email, email)).get()
    if (existingEmailUser) {
        return { error: "User already exists with this email." }
    }

    const existingUsername = await db.select().from(users).where(eq(users.username, username)).get()
    if (existingUsername) {
        return { error: "Username is already taken." }
    }

    const hashedPassword = await bcryptjs.hash(password, 10)

    try {
        await db.insert(users).values({
            name,
            username,
            email,
            password: hashedPassword,
        })
        return { success: true }
    } catch (error) {
        console.error("Failed to register user:", error)
        return { error: "Failed to create account." }
    }
}
