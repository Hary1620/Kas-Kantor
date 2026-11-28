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

export async function saveMethod(
  values: unknown,
  id?: string,
  qrisFile?: File | null
): Promise<ActionResult> {
  const parsed = methodSchema.safeParse(values);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  if (id && !isUuid(id)) {
    return { error: "ID metode tidak valid" };
  }

  // Validasi file QRIS jika admin memilih gambar
  if (qrisFile && qrisFile.size > 5 * 1024 * 1024) {
    return { error: "Ukuran gambar QRIS maksimal 5 MB." };
  }

  const allowedTypes: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  };

  if (qrisFile && !allowedTypes[qrisFile.type]) {
    return { error: "Format gambar harus PNG, JPG, atau WEBP." };
  }

  const { supabase } = await requireAdmin();
  const d = parsed.data;

  let existingQrUrl: string | null = null;

if (id) {
  const { data: existingMethod, error: existingError } = await supabase
    .from("payment_methods")
    .select("qr_image_url")
    .eq("id", id)
    .single();

  if (existingError) {
    return { error: "Gagal memeriksa gambar QRIS sebelumnya." };
  }

  existingQrUrl = existingMethod.qr_image_url;
}

if (!d.account_number && !qrisFile && !existingQrUrl) {
  return {
    error: "Nomor rekening atau gambar QRIS wajib diisi.",
  };
}

  let qrImageUrl: string | null = null;
  let uploadedPath: string | null = null;

  // Upload gambar QRIS terlebih dahulu jika ada file baru
  if (qrisFile) {
    const extension = allowedTypes[qrisFile.type];
    uploadedPath = `${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("qris")
      .upload(uploadedPath, qrisFile, {
        contentType: qrisFile.type,
        upsert: false,
      });

    if (uploadError) {
      return { error: "Gagal mengunggah gambar QRIS." };
    }

    const { data: publicUrlData } = supabase.storage
      .from("qris")
      .getPublicUrl(uploadedPath);

    qrImageUrl = publicUrlData.publicUrl;
  }

  const row = {
    name: d.name,
    provider: d.provider || null,
    account_number: d.account_number,
    account_owner: d.account_owner,
    note: d.note || null,
    ...(qrisFile ? { qr_image_url: qrImageUrl } : {}),
  };

  const { error } = id
    ? await supabase.from("payment_methods").update(row).eq("id", id)
    : await supabase.from("payment_methods").insert({
        ...row,
        qr_image_url: qrImageUrl,
      });

  if (error) {
    // Hapus file baru jika penyimpanan data metode gagal
    if (uploadedPath) {
      await supabase.storage.from("qris").remove([uploadedPath]);
    }

    return { error: "Gagal menyimpan metode pembayaran." };
  }

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