import type { NextAuthOptions, DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "../db"
import { users, permissions, userPermissions } from "../db/schema"
import { eq } from "drizzle-orm"
import bcryptjs from "bcryptjs"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            permissions: string[]
        } & DefaultSession["user"]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        permissions: string[]
    }
}

export const authOptions: NextAuthOptions = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adapter: DrizzleAdapter(db) as any,
    session: { strategy: "jwt" },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const email = credentials.email as string
                const user = await db.select().from(users).where(eq(users.email, email)).get()

                if (!user || !user.password) {
                    return null
                }

                const passwordsMatch = await bcryptjs.compare(
                    credentials.password as string,
                    user.password
                )

                if (passwordsMatch) {
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        image: user.image,
                    }
                }

                return null
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            // Initial sign in
            if (user) {
                token.id = user.id

                // Fetch permissions for this user
                const userPerms = await db
                    .select({ name: permissions.name })
                    .from(permissions)
                    .innerJoin(userPermissions, eq(userPermissions.permissionId, permissions.id))
                    .where(eq(userPermissions.userId, user.id))

                token.permissions = userPerms.map((p) => p.name)
            }
            return token
        },
        session({ session, token }) {
            if (token.id) {
                session.user.id = token.id as string
                session.user.permissions = (token.permissions as string[]) || []
            }
            return session
        },
    },
}
