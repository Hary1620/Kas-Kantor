import { UnpaidToggle } from "@/components/settings/unpaid-toggle";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("app_settings").select("value").eq("key", "show_unpaid_members").maybeSingle();
  if (error) throw new Error(error.message);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Atur informasi yang tampil di halaman publik.</p>
      </div>
      <UnpaidToggle initial={data?.value === true} />
    </div>
  );
}