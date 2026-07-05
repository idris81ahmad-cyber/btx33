import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

const users = [
  {
    id: "1",
    username: "admin",
    // hashed "password"  (use bcrypt to generate new ones for prod)
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
    name: "BIYORA SHOP Admin",
  },
  {
    id: "2",
    username: "halifa81",
    password: "$2b$10$NHjw7GrEcNuRFzc0ohscbelRgHmN41fJoJ55KhbQ0GoF0FaAvDRmW",
    name: "Halifa Admin",
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
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username?.trim();
        const password = credentials?.password;
        if (!username || !password) return null;

        const user = users.find(
          (u) => u.username.toLowerCase() === username.toLowerCase()
        );
        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return { id: user.id, name: user.name, username: user.username } as any;
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) (token as any).username = (user as any).username;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).username = (token as any).username;
      return session;
    },
  },
};

// For App Router route handlers
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// For server-side session checks in API routes
export { getServerSession } from "next-auth";
