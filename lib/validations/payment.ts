import { z } from "zod";

export const paymentSchema = z.object({
  member_due_id: z.string().uuid("Pilih anggota dan periode"),
  amount: z
    .number({ message: "Nominal wajib diisi" })
    .int("Nominal harus bilangan bulat")
    .min(1, "Nominal harus lebih dari 0"),
  paid_at: z.string().min(1, "Tanggal pembayaran wajib diisi"),
  payment_method_id: z.union([z.literal(""), z.string().uuid()]),
  notes: z.string().trim().max(500, "Catatan maksimal 500 karakter"),
});

export type PaymentValues = z.infer<typeof paymentSchema>;