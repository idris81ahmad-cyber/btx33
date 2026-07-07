import NextAuth, { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/db/users";

if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

const legacyAdmins = [
  {
    id: "admin-1",
    email: "admin@biyorashop.com",
    username: "admin",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
    name: "BIYORA SHOP Admin",
    role: "admin" as const,
  },
  {
    id: "admin-2",
    email: "halifa@biyorashop.com",
    username: "halifa81",
    password: "$2b$10$NHjw7GrEcNuRFzc0ohscbelRgHmN41fJoJ55KhbQ0GoF0FaAvDRmW",
    name: "Halifa Admin",
    role: "admin" as const,
  },
];

const authSecret =
  process.env.NEXTAUTH_SECRET ??
  "BD4o4R2MTp5PbRAl3GPVmIdCu2Hoe1gXiLJ4bXtqOQU=";

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.email?.trim() || credentials?.username?.trim();
        const password = credentials?.password;
        if (!identifier || !password) return null;

        // DB customer/admin
        const dbUser = await getUserByEmail(identifier.includes("@") ? identifier : `${identifier}@local.biyora`);
        if (!dbUser) {
          const byUsername = legacyAdmins.find(
            (u) => u.username.toLowerCase() === identifier.toLowerCase() || u.email === identifier.toLowerCase(),
          );
          if (byUsername) {
            const valid = await bcrypt.compare(password, byUsername.password);
            if (!valid) return null;
            return {
              id: byUsername.id,
              name: byUsername.name,
              email: byUsername.email,
              role: byUsername.role,
            };
          }
        } else {
          const valid = await bcrypt.compare(password, dbUser.passwordHash);
          if (!valid) return null;
          return {
            id: String(dbUser.id),
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
          };
        }

        // Legacy admin fallback by username
        const legacy = legacyAdmins.find((u) => u.username.toLowerCase() === identifier.toLowerCase());
        if (legacy) {
          const valid = await bcrypt.compare(password, legacy.password);
          if (!valid) return null;
          return { id: legacy.id, name: legacy.name, email: legacy.email, role: legacy.role };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
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
  if (!session || session.user.role !== "admin") return null;
  return session;
}

export async function requireCustomer() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session;
}