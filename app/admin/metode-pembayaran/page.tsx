import { MethodsTable, type MethodRow } from "@/components/methods/methods-table";
import { createClient } from "@/lib/supabase/server";

export default async function MethodsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("payment_methods").select("*").order("name");
  if (error) throw new Error(error.message);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Metode Pembayaran</h1>
        <p className="text-sm text-muted-foreground">
          Metode yang aktif tampil di halaman publik beserta tombol salin nomor. Metode yang dinonaktifkan tidak dihapus,
          sehingga riwayat pembayaran lama tetap utuh.
        </p>
      </div>
      <MethodsTable methods={(data ?? []) as MethodRow[]} />
    </div>
  );
}