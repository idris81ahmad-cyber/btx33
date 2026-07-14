import NextAuth, { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/db/users";

if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

const getAuthSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret) return secret;

  // Next.js evaluates auth modules during "Collecting page data" at build time.
  // Vercel may not inject secrets until runtime, so allow the build to finish.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "build-time-placeholder-secret";
  }

  throw new Error(
    "NEXTAUTH_SECRET is not set. Please generate a strong secret (use: openssl rand -base64 32) and add it to your environment variables.",
  );
};

export const authOptions: NextAuthOptions = {
  secret: getAuthSecret(),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier =
          credentials?.email?.trim() || credentials?.username?.trim();
        const password = credentials?.password;

        if (!identifier || !password) return null;

        // Database users only — no in-code legacy admin passwords
        const email = identifier.includes("@")
          ? identifier
          : null;
        if (!email) {
          // Usernames are not supported; require full email for all accounts
          return null;
        }

        const dbUser = await getUserByEmail(email);
        if (!dbUser) return null;

        const valid = await bcrypt.compare(password, dbUser.passwordHash);
        if (!valid) return null;

        return {
          id: String(dbUser.id),
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "admin" | "customer") ?? "customer";
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
export { getServerSession };

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return null;
  }
  return session;
}

export async function requireCustomer() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session;
}

export async function requireAdminOrThrow() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}
