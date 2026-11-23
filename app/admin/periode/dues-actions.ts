"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";

const uuid = z.string().uuid();
const amountSchema = z
  .number({ message: "Nominal wajib diisi" })
  .int("Nominal harus bilangan bulat")
  .min(0, "Nominal tidak boleh negatif");

function refresh() {
  revalidatePath("/admin/periode");
  revalidatePath("/admin/periode/[id]", "page");
  revalidatePath("/admin/anggota/[id]", "page");
}

// Pesan dari pengaman database (P0001) aman ditampilkan apa adanya
function dbMessage(error: { code?: string; message: string }, fallback: string) {
  return error.code === "P0001" ? error.message : fallback;
}

export async function assignMembers(periodId: string, memberIds: string[], amount: number): Promise<ActionResult> {
  if (!uuid.safeParse(periodId).success) return { error: "ID periode tidak valid" };
  const ids = z.array(z.string().uuid()).min(1, "Pilih minimal satu anggota").max(500).safeParse(memberIds);
  if (!ids.success) return { error: ids.error.issues[0]?.message ?? "Data anggota tidak valid" };
  const amt = amountSchema.safeParse(amount);
  if (!amt.success) return { error: amt.error.issues[0]?.message ?? "Nominal tidak valid" };

  const { supabase } = await requireAdmin();

  const { data: period } = await supabase.from("dues_periods").select("status").eq("id", periodId).single();
  if (!period) return { error: "Periode tidak ditemukan" };
  if (period.status === "cancelled" || period.status === "completed") {
    return { error: "Periode yang Selesai atau Dibatalkan tidak dapat ditambah anggota." };
  }

  const { data: active } = await supabase.from("members").select("id").in("id", ids.data).eq("is_active", true);
  const rows = (active ?? []).map((m: { id: string }) => ({
    member_id: m.id,
    period_id: periodId,
    amount_due: amt.data,
  }));
  if (rows.length === 0) return { error: "Tidak ada anggota aktif yang dipilih." };

  // Nominal disalin (snapshot) ke kewajiban; anggota yang sudah terdaftar dilewati
  const { error } = await supabase
    .from("member_dues")
    .upsert(rows, { onConflict: "member_id,period_id", ignoreDuplicates: true });
 if (error) {
  console.error("Error assignMembers:", {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });

  return { error: "Gagal menambahkan anggota." };
}

  refresh();
  return {};
}

export async function updateMemberDue(id: string, amount: number): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return { error: "ID kewajiban tidak valid" };
  const amt = amountSchema.safeParse(amount);
  if (!amt.success) return { error: amt.error.issues[0]?.message ?? "Nominal tidak valid" };

  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("member_dues").update({ amount_due: amt.data }).eq("id", id);
  if (error) return { error: dbMessage(error, "Gagal mengubah nominal.") };

  refresh();
  return {};
}

export async function setMemberDueCancelled(id: string, cancelled: boolean): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return { error: "ID kewajiban tidak valid" };

  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("member_dues").update({ is_cancelled: cancelled }).eq("id", id);
  if (error) return { error: dbMessage(error, "Gagal mengubah status kewajiban.") };

  refresh();
  return {};
}