import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const users = [
  {
    id: "1",
    username: "admin",
    // hashed "password"  (use bcrypt to generate new ones for prod)
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
    name: "BTX3 Admin",
  },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = users.find((u) => u.username === credentials.username);
        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
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
