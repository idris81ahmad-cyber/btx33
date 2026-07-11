import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Sign In",
  description: "Sign in to your BIYORA SHOP account to track orders and save addresses.",
  path: "/login",
  noIndex: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
