import { z } from "zod";

export const memberSchema = z.object({
  full_name: z.string().trim().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  phone: z
    .string()
    .trim()
    .max(30, "Nomor terlalu panjang")
    .regex(/^[0-9+\-\s]*$/, "Nomor hanya boleh berisi angka, spasi, + dan -"),
  joined_at: z.string().min(1, "Tanggal bergabung wajib diisi"),
  notes: z.string().trim().max(500, "Catatan maksimal 500 karakter"),
});

export type MemberValues = z.infer<typeof memberSchema>;