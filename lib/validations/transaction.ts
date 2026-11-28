import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  category_id: z.string().uuid("Pilih kategori"),
  amount: z
    .number({ message: "Nominal wajib diisi" })
    .int("Nominal harus bilangan bulat")
    .min(1, "Nominal harus lebih dari 0"),
  transaction_date: z.string().min(1, "Tanggal wajib diisi"),
  description: z.string().trim().min(1, "Deskripsi wajib diisi").max(200, "Deskripsi maksimal 200 karakter"),
  payment_method_id: z.union([z.literal(""), z.string().uuid()]),
  notes: z.string().trim().max(500, "Catatan maksimal 500 karakter"),
});

export type TransactionValues = z.infer<typeof transactionSchema>;