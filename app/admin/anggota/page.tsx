import { connection } from "next/server";
import { MembersTable } from "@/components/members/members-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fieldClass } from "@/lib/ui";
import { createClient } from "@/lib/supabase/server";

export const instant = false;
export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await connection();

  const { q = "", status = "all" } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("members").select("*").order("full_name");
  if (q) query = query.ilike("full_name", `%${q.replace(/[%_]/g, "")}%`);
  if (status === "active") query = query.eq("is_active", true);
  if (status === "inactive") query = query.eq("is_active", false);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Anggota</h1>
        <p className="text-sm text-muted-foreground">Kelola data anggota kas.</p>
      </div>

      <form className="flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Cari nama anggota..." className="max-w-xs bg-white" />
        <select name="status" defaultValue={status} className={fieldClass}>
          <option value="all">Semua status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
        <Button type="submit" variant="outline">
          Cari
        </Button>
      </form>

      <MembersTable members={data ?? []} />
    </div>
  );
}