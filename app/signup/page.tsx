"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      toast.error(data.error || "Signup failed");
      return;
    }

    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    toast.success("Welcome to BIYORA SHOP!");
    router.push("/account");
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <div className="text-xs tracking-[3px] text-[#C5A46E]">JOIN BIYORA SHOP</div>
        <h1 className="text-4xl font-semibold tracking-tight mt-2">Create account</h1>
        <p className="text-sm text-[#6B5F54] mt-2">Save addresses, track orders, and checkout faster.</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-[#D4C9B8] rounded-3xl p-8 space-y-4">
        <div>
          <Label>Full name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 rounded-2xl" required />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 rounded-2xl" required />
        </div>
        <div>
          <Label>Phone (WhatsApp)</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5 rounded-2xl" />
        </div>
        <div>
          <Label>Password (min 6 characters)</Label>
          <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1.5 rounded-2xl" required minLength={6} />
        </div>
        <Button type="submit" disabled={loading} className="w-full py-5 rounded-2xl bg-[#6B2D3C]">
          {loading ? "Creating account..." : "Create account"}
        </Button>
        <p className="text-center text-sm text-[#6B5F54]">
          Already have an account? <Link href="/login" className="underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}