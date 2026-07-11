import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Admin Dashboard",
  description: "BIYORA SHOP admin panel",
  path: "/admin",
  noIndex: true,
});

/**
 * Auth is enforced by middleware.ts for /admin/* (except /admin/login).
 * Page-level useSession still guards client UI.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
