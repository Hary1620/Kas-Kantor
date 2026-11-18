import Link from "next/link";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Masuk Admin
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 p-4 md:py-8">{children}</main>
    </div>
  );
}