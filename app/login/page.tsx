"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      toast.error("Invalid email or password");
      return;
    }

    const res = await fetch("/api/auth/session");
    const session = await res.json();
    if (session?.user?.role === "admin") {
      router.push("/admin");
    } else {
      router.push(callbackUrl);
    }
    router.refresh();
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <div className="text-xs tracking-[3px] text-[#C5A46E]">WELCOME BACK</div>
        <h1 className="text-4xl font-semibold tracking-tight mt-2">Sign in</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-[#D4C9B8] rounded-3xl p-8 space-y-5">
        <div>
          <Label>Email or admin username</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 rounded-2xl" required />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 rounded-2xl" required />
        </div>
        <Button type="submit" disabled={loading} className="w-full py-5 rounded-2xl bg-[#6B2D3C]">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
        <p className="text-center text-sm text-[#6B5F54]">
          New customer? <Link href="/signup" className="text-[#6B2D3C] underline">Create account</Link>
        </p>
        <p className="text-center text-xs text-[#6B5F54]">
          Admin? Use your admin username (e.g. halifa81)
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}