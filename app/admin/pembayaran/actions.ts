"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import { paymentSchema } from "@/lib/validations/payment";

const keySchema = z.string().min(8).max(100);

function rpcMessage(error: { code?: string; message: string }, fallback: string) {
  if (error.code === "P0001") return error.message; // pesan dari aturan di database
  if (error.code === "42501") return "Akses ditolak.";
  if (error.code === "23505") return "Pembayaran ini sudah tercatat.";
  return fallback;
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/pembayaran");
  revalidatePath("/admin/periode");
  revalidatePath("/admin/periode/[id]", "page");
  revalidatePath("/admin/anggota/[id]", "page");
}

export async function recordPayment(values: unknown, idempotencyKey: string): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  if (!keySchema.safeParse(idempotencyKey).success) return { error: "Kunci pembayaran tidak valid" };

  const { supabase } = await requireAdmin();
  const d = parsed.data;
  const { error } = await supabase.rpc("record_payment", {
    p_member_due_id: d.member_due_id,
    p_amount: d.amount,
    p_paid_at: d.paid_at,
    p_payment_method_id: d.payment_method_id || null,
    p_receipt_path: null, // unggah bukti dikerjakan di Fase 5
    p_notes: d.notes || null,
    p_idempotency_key: idempotencyKey,
  });
  if (error) return { error: rpcMessage(error, "Gagal mencatat pembayaran.") };

  refresh();
  return {};
}

export async function replacePayment(paymentId: string, values: unknown, idempotencyKey: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(paymentId).success) return { error: "ID pembayaran tidak valid" };
  const parsed = paymentSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  if (!keySchema.safeParse(idempotencyKey).success) return { error: "Kunci pembayaran tidak valid" };

  const { supabase } = await requireAdmin();
  const d = parsed.data;
  const { error } = await supabase.rpc("replace_payment", {
    p_payment_id: paymentId,
    p_amount: d.amount,
    p_paid_at: d.paid_at,
    p_payment_method_id: d.payment_method_id || null,
    p_notes: d.notes || null,
    p_idempotency_key: idempotencyKey,
  });
  if (error) return { error: rpcMessage(error, "Gagal mengubah pembayaran.") };

  refresh();
  return {};
}

export async function voidPayment(paymentId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(paymentId).success) return { error: "ID pembayaran tidak valid" };

  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("void_payment", { p_payment_id: paymentId });
  if (error) return { error: rpcMessage(error, "Gagal membatalkan pembayaran.") };

  refresh();
  return {};
}