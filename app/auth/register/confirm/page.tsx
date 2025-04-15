import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ email: string }>;
}

export default async function ConfirmPage({ searchParams }: Props) {
  const { email } = await searchParams;

  return (
    <div className="flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            Verifica tu correo electrónico
          </CardTitle>
          <CardDescription>
            Hemos enviado un enlace de confirmación a tu correo
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-blue-50 rounded-md p-4 text-blue-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 inline-block mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Email de verificación enviado.
          </div>

          <p className="text-sm">
            Por favor, revisa tu bandeja de entrada en <strong>{email}</strong>{" "}
            y haz clic en el enlace de confirmación para activar tu cuenta.
          </p>

          <p className="text-sm text-gray-500">
            Si no encuentras el correo, revisa tu carpeta de spam o correo no
            deseado.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button asChild className="w-full">
            <Link href="/auth/login">Ir a iniciar sesión</Link>
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Una vez que hayas confirmado tu correo, podrás iniciar sesión con
            tus credenciales.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
