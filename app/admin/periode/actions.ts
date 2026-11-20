"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import { periodSchema } from "@/lib/validations/period";

export async function savePeriod(values: unknown, id?: string): Promise<ActionResult> {
  const parsed = periodSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  if (id && !z.string().uuid().safeParse(id).success) return { error: "ID periode tidak valid" };

  const { supabase } = await requireAdmin();
  const d = parsed.data;

  // Periode yang sudah menerima pembayaran tidak boleh dibatalkan begitu saja
  if (id && d.status === "cancelled") {
    const { data: paid } = await supabase
      .from("payments")
      .select("id, member_dues!inner(period_id)")
      .eq("member_dues.period_id", id)
      .eq("status", "valid")
      .limit(1);
    if (paid && paid.length > 0) {
      return {
        error: "Periode ini sudah memiliki pembayaran. Batalkan pembayarannya terlebih dahulu, atau pilih status Selesai.",
      };
    }
  }

  const row = {
    name: d.name,
    start_date: d.start_date,
    end_date: d.end_date,
    due_date: d.due_date,
    default_amount: d.default_amount,
    allow_installments: d.allow_installments,
    status: d.status,
    description: d.description || null,
  };

  const { error } = id
    ? await supabase.from("dues_periods").update(row).eq("id", id)
    : await supabase.from("dues_periods").insert(row);
  if (error) return { error: "Gagal menyimpan periode." };

  revalidatePath("/admin/periode");
  return {};
}