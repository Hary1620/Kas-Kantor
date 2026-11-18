import { Wallet } from "lucide-react";

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-bold text-primary">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
        <Wallet className="size-4" />
      </span>
      Kas Kita
    </span>
  );
}