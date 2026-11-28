import { z } from "zod";

export const methodSchema = z.object({
  name: z.string().trim().min(1, "Nama metode wajib diisi").max(60, "Maksimal 60 karakter"),
  provider: z.string().trim().max(60, "Maksimal 60 karakter"),
  account_number: z
    .string()
    .trim()
    .min(1, "Nomor tujuan wajib diisi")
    .max(40, "Nomor terlalu panjang")
    .regex(/^[0-9\s\-]+$/, "Nomor hanya boleh berisi angka, spasi, dan -"),
  account_owner: z.string().trim().min(1, "Nama pemilik wajib diisi").max(80, "Maksimal 80 karakter"),
  note: z.string().trim().max(300, "Catatan maksimal 300 karakter"),
});

export type MethodValues = z.infer<typeof methodSchema>;