import { Suspense } from "react";
import Image from "next/image";
import LoginForm from "./login-form";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-12">
      <header className="flex flex-col items-center gap-3 text-center">
        <Image src="/icons/icon-192.png" alt="" width={72} height={72} priority className="rounded-[20px] shadow-lg" />
        <h1 className="text-[34px] font-bold tracking-tight">GastoApp</h1>
        <p className="text-[15px] text-muted">Tus gastos, el internet compartido y tus juegos en un solo lugar.</p>
      </header>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
