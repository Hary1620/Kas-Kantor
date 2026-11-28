"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";

export async function setShowUnpaid(show: boolean): Promise<ActionResult> {
  if (typeof show !== "boolean") return { error: "Nilai tidak valid" };

  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "show_unpaid_members", value: show, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return { error: "Gagal menyimpan pengaturan." };

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/pengaturan");
  return {};
}