import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva contraseña</CardTitle>
        <CardDescription>Elige una nueva contraseña para tu cuenta.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
