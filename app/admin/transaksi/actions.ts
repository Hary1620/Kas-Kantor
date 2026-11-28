"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import { transactionSchema } from "@/lib/validations/transaction";

const isUuid = (v: string) => z.string().uuid().safeParse(v).success;

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/transaksi");
}

export async function saveTransaction(values: unknown, id?: string): Promise<ActionResult> {
  const parsed = transactionSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  if (id && !isUuid(id)) return { error: "ID transaksi tidak valid" };

  const { supabase, user } = await requireAdmin();
  const d = parsed.data;

  const { data: cat } = await supabase.from("categories").select("id, name, type").eq("id", d.category_id).single();
  if (!cat || cat.type !== d.type) return { error: "Kategori tidak sesuai dengan jenis transaksi." };
  if (cat.name === "Iuran Anggota") {
    return { error: "Kategori Iuran Anggota hanya untuk pembayaran iuran. Catat lewat menu Pembayaran." };
  }

  const row = {
    type: d.type,
    category_id: d.category_id,
    amount: d.amount,
    transaction_date: d.transaction_date,
    description: d.description,
    payment_method_id: d.payment_method_id || null,
    notes: d.notes || null,
  };

  if (id) {
    // Hanya transaksi manual (payment_id kosong) yang boleh diubah dari sini
    const { data, error } = await supabase.from("transactions").update(row).eq("id", id).is("payment_id", null).select("id");
    if (error) return { error: "Gagal menyimpan transaksi." };
    if (!data || data.length === 0) {
      return { error: "Transaksi tidak ditemukan, atau berasal dari pembayaran (ubah lewat menu Pembayaran)." };
    }
  } else {
    const { error } = await supabase.from("transactions").insert({ ...row, created_by: user.id });
    if (error) return { error: "Gagal menyimpan transaksi." };
  }

  refresh();
  return {};
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return { error: "ID transaksi tidak valid" };

  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("transactions").delete().eq("id", id).is("payment_id", null).select("id");
  if (error) return { error: "Gagal menghapus transaksi." };
  if (!data || data.length === 0) {
    return { error: "Transaksi tidak ditemukan, atau berasal dari pembayaran (batalkan lewat menu Pembayaran)." };
  }

  refresh();
  return {};
}