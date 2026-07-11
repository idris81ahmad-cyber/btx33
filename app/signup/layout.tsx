import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Create Account",
  description: "Join BIYORA SHOP to shop premium African textiles and track your orders.",
  path: "/signup",
  noIndex: true,
});

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
