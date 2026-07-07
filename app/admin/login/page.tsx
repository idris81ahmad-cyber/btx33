"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const { data: session, status } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // If already logged in, go straight to admin
  useEffect(() => {
    if (status === "loading") return;
    if (session) {
      router.replace("/admin");
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.ok) {
      const res = await fetch("/api/auth/session");
      const sess = await res.json();
      if (sess?.user?.role !== "admin") {
        await signOut({ redirect: false });
        setError("This account does not have admin access.");
        setLoading(false);
        return;
      }
      router.push("/admin");
    } else if (result?.error === "CredentialsSignin") {
      setError("Invalid username or password");
    } else {
      setError(
        result?.error ??
          "Sign-in failed. If this persists, ensure NEXTAUTH_SECRET is set on the server."
      );
    }
    setLoading(false);
  };

  if (status === "loading" || session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F4EC]">
        <div className="text-[#6B5F54]">Checking session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F4EC]">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border border-[#D4C9B8]">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🛠️</div>
          <h1 className="text-3xl font-semibold tracking-tight">BIYORA SHOP Admin</h1>
          <p className="text-[#6B5F54] mt-2">Manage your premium textiles</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm text-[#6B5F54] block mb-1.5">USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-premium w-full"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="text-sm text-[#6B5F54] block mb-1.5">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-premium w-full"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-lg"
          >
            {loading ? "SIGNING IN..." : "SIGN IN TO ADMIN"}
          </button>
        </form>

        <p className="text-center text-xs text-[#6B5F54] mt-8">
          Sign in with your admin credentials
        </p>
      </div>
    </div>
  );
}