import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Logo />
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader>
          <CardTitle>Masuk Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
        ← Kembali ke dashboard publik
      </Link>
    </div>
  );
}