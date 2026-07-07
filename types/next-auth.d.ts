import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: "admin" | "customer";
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role: "admin" | "customer";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "admin" | "customer";
    email?: string;
  }
}