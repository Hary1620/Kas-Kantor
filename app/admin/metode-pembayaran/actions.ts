"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import { methodSchema } from "@/lib/validations/method";

const isUuid = (v: string) => z.string().uuid().safeParse(v).success;

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin/metode-pembayaran");
}

export async function saveMethod(values: unknown, id?: string): Promise<ActionResult> {
  const parsed = methodSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  if (id && !isUuid(id)) return { error: "ID metode tidak valid" };

  const { supabase } = await requireAdmin();
  const d = parsed.data;
  const row = {
    name: d.name,
    provider: d.provider || null,
    account_number: d.account_number,
    account_owner: d.account_owner,
    note: d.note || null,
  };

  const { error } = id
    ? await supabase.from("payment_methods").update(row).eq("id", id)
    : await supabase.from("payment_methods").insert(row);
  if (error) return { error: "Gagal menyimpan metode pembayaran." };

  refresh();
  return {};
}

export async function setMethodActive(id: string, active: boolean): Promise<ActionResult> {
  if (!isUuid(id)) return { error: "ID metode tidak valid" };

  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("payment_methods").update({ is_active: active }).eq("id", id);
  if (error) return { error: "Gagal mengubah status metode." };

  refresh();
  return {};
}