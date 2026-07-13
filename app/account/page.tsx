"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { orderStatusClass, orderStatusLabel } from "@/lib/order-status";
import { Package } from "lucide-react";

interface Order {
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

interface Address {
  id: number;
  label: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrForm, setAddrForm] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "FCT - Abuja",
    postalCode: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/account");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role === "admin") router.replace("/admin");
  }, [session, router]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/account/orders").then((r) => r.json()).then((d) => setOrders(d.orders ?? []));
    fetch("/api/account/addresses").then((r) => r.json()).then((d) => setAddresses(d.addresses ?? []));
  }, [session]);

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addrForm, isDefault: addresses.length === 0 }),
    });
    if (res.ok) {
      toast.success("Address saved");
      const data = await fetch("/api/account/addresses").then((r) => r.json());
      setAddresses(data.addresses ?? []);
    } else {
      toast.error("Could not save address");
    }
  };

  if (status === "loading" || !session) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-4" aria-busy="true" aria-label="Loading account">
        <div className="h-8 w-56 skeleton rounded" />
        <div className="h-4 w-40 skeleton rounded" />
        <div className="h-44 skeleton rounded-3xl" />
        <div className="h-64 skeleton rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 pb-24">
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="text-xs tracking-[3px] text-[#C5A46E]">MY ACCOUNT</div>
          <h1 className="text-4xl font-semibold tracking-tight">Hello, {session.user.name}</h1>
          <p className="text-[#6B5F54] text-sm">{session.user.email}</p>
        </div>
        <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>Sign out</Button>
      </div>

      <div className="grid gap-8">
        <Card className="rounded-3xl border-[#D4C9B8]">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#C5A46E]" aria-hidden="true" />
              Recent orders
            </CardTitle>
            <Link
              href="/account/orders"
              className="text-sm font-medium text-[#6B2D3C] underline underline-offset-2"
            >
              View all & track delivery
            </Link>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-[#6B5F54] text-sm">
                No orders yet.{" "}
                <Link href="/shop" className="underline">
                  Start shopping
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((o) => (
                  <Link
                    key={o.orderNumber}
                    href="/account/orders"
                    className="flex justify-between items-start gap-3 p-4 bg-[#F8F4EC] rounded-2xl hover:bg-[#F1EDE4] transition"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-sm font-medium truncate">
                        {o.orderNumber}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${orderStatusClass(o.status)}`}
                        >
                          {orderStatusLabel(o.status)}
                        </span>
                        <span className="text-xs text-[#6B5F54]">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-[#6B5F54] mt-1 line-clamp-1">
                        {o.items?.map((i) => i.name).join(", ")}
                      </div>
                    </div>
                    <div className="font-semibold tabular-nums shrink-0">
                      ₦{o.total?.toLocaleString()}
                    </div>
                  </Link>
                ))}
                {orders.length > 5 && (
                  <p className="text-xs text-center text-[#6B5F54] pt-1">
                    +{orders.length - 5} more —{" "}
                    <Link href="/account/orders" className="underline">
                      see full history
                    </Link>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[#D4C9B8]">
          <CardHeader>
            <CardTitle>Saved addresses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {addresses.map((a) => (
              <div key={a.id} className="p-4 border border-[#D4C9B8] rounded-2xl text-sm">
                <div className="font-medium">{a.label} {a.isDefault && <span className="text-[#C5A46E] text-xs">(default)</span>}</div>
                <div className="text-[#6B5F54]">{a.fullName} — {a.address}, {a.city}, {a.state}</div>
              </div>
            ))}
            <form onSubmit={saveAddress} className="grid md:grid-cols-2 gap-4 pt-4 border-t border-[#D4C9B8]">
              <div><Label>Label</Label><Input value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })} className="mt-1 rounded-xl" /></div>
              <div><Label>Full name</Label><Input value={addrForm.fullName} onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })} className="mt-1 rounded-xl" required /></div>
              <div><Label>Phone</Label><Input value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} className="mt-1 rounded-xl" required /></div>
              <div className="md:col-span-2"><Label>Address</Label><Input value={addrForm.address} onChange={(e) => setAddrForm({ ...addrForm, address: e.target.value })} className="mt-1 rounded-xl" required /></div>
              <div><Label>City</Label><Input value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} className="mt-1 rounded-xl" required /></div>
              <div><Label>State</Label><Input value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} className="mt-1 rounded-xl" required /></div>
              <div className="md:col-span-2"><Button type="submit" className="bg-[#6B2D3C]">Save address</Button></div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}