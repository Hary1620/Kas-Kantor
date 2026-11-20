
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { createClient } from "@/lib/supabase/server";

async function AdminContent({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: isAdmin, error } = await supabase.rpc("is_admin");

  if (error || !isAdmin) redirect("/login");

  return <AdminShell>{children}</AdminShell>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">
          Memeriksa akses admin...
        </div>
      }
    >
      <AdminContent>{children}</AdminContent>
    </Suspense>
  );
}
