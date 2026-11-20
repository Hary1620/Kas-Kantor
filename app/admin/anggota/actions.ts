"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import { memberSchema } from "@/lib/validations/member";

const isUuid = (v: string) => z.string().uuid().safeParse(v).success;

export async function saveMember(values: unknown, id?: string): Promise<ActionResult> {
  const parsed = memberSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  if (id && !isUuid(id)) return { error: "ID anggota tidak valid" };

  const { supabase } = await requireAdmin();
  const row = {
    full_name: parsed.data.full_name,
    phone: parsed.data.phone || null,
    joined_at: parsed.data.joined_at,
    notes: parsed.data.notes || null,
  };

  const { error } = id
    ? await supabase.from("members").update(row).eq("id", id)
    : await supabase.from("members").insert(row);
  if (error) return { error: "Gagal menyimpan anggota." };

  revalidatePath("/admin/anggota");
  return {};
}

export async function setMemberActive(id: string, active: boolean): Promise<ActionResult> {
  if (!isUuid(id)) return { error: "ID anggota tidak valid" };
  const { supabase } = await requireAdmin();

  // Hanya mengubah status; riwayat keuangan tidak disentuh
  const { error } = await supabase.from("members").update({ is_active: active }).eq("id", id);
  if (error) return { error: "Gagal mengubah status anggota." };

  revalidatePath("/admin/anggota");
  return {};
}