import { z } from "zod";

export const periodSchema = z
  .object({
    name: z.string().trim().min(1, "Nama periode wajib diisi").max(100, "Nama maksimal 100 karakter"),
    start_date: z.string().min(1, "Tanggal mulai wajib diisi"),
    end_date: z.string().min(1, "Tanggal berakhir wajib diisi"),
    due_date: z.string().min(1, "Batas waktu pembayaran wajib diisi"),
    default_amount: z
      .number({ message: "Nominal wajib diisi" })
      .int("Nominal harus bilangan bulat")
      .min(0, "Nominal tidak boleh negatif"),
    allow_installments: z.boolean(),
    status: z.enum(["draft", "active", "completed", "cancelled"]),
    description: z.string().trim().max(500, "Keterangan maksimal 500 karakter"),
  })
  .refine((d) => d.end_date >= d.start_date, {
    message: "Tanggal berakhir tidak boleh sebelum tanggal mulai",
    path: ["end_date"],
  });

export type PeriodValues = z.infer<typeof periodSchema>;