"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, CalendarRange, FileText, LayoutDashboard, Menu, Settings, Users, Wallet } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/anggota", label: "Anggota", icon: Users },
  { href: "/admin/periode", label: "Periode Iuran", icon: CalendarRange },
  { href: "/admin/pembayaran", label: "Pembayaran", icon: Wallet },
  { href: "/admin/transaksi", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/admin/laporan", label: "Laporan", icon: FileText },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-brand-light text-primary" : "text-muted-foreground hover:bg-brand-light/60 hover:text-primary"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-64 shrink-0 border-r bg-white p-4 md:block">
        <div className="mb-6 px-2">
          <Logo />
        </div>
        <NavLinks />
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-white px-4 md:hidden">
          
          <Button variant="ghost" size="icon" aria-label="Buka menu" onClick={() => setOpen(true)}>
  <Menu />
</Button>
<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent side="left" className="w-64 bg-white p-4">
    <SheetTitle className="mb-4">
      <Logo />
    </SheetTitle>
    <NavLinks onNavigate={() => setOpen(false)} />
  </SheetContent>
</Sheet>
<Logo />
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}