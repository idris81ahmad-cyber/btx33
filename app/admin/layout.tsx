import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Admin Dashboard",
  description: "BIYORA SHOP admin panel",
  path: "/admin",
  noIndex: true,
});

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  if (!session) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}