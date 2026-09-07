import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>Ingresa con tu cuenta de agente para continuar.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {params.message === "password-updated" && (
          <Alert>
            <AlertDescription>
              Tu contraseña se actualizó correctamente. Inicia sesión con tu nueva contraseña.
            </AlertDescription>
          </Alert>
        )}
        {params.error === "invalid-link" && (
          <Alert variant="destructive">
            <AlertDescription>
              El enlace no es válido o ya expiró. Solicita uno nuevo desde &quot;¿Olvidaste tu
              contraseña?&quot;.
            </AlertDescription>
          </Alert>
        )}
        <LoginForm />
      </CardContent>
    </Card>
  );
}
