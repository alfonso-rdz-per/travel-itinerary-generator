import Image from "next/image";
import logo from "@/public/branding/trust-logo.png";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="mb-8 flex flex-col items-center text-center">
        <Image src={logo} alt="Wander Travel" priority className="h-28 w-auto" sizes="320px" />
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
