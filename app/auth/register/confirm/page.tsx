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
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            Verify your email
          </CardTitle>
          <CardDescription>
            We&apos;ve sent a confirmation link to your email
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-md bg-primary/10 p-4 text-primary">
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
            Verification email sent.
          </div>

          <p className="text-sm">
            Please check your inbox at <strong>{email}</strong>{" "}
            and click the confirmation link to activate your account.
          </p>

          <p className="text-sm text-muted-foreground">
            If you can&apos;t find the email, check your spam or junk folder.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button asChild className="w-full">
            <Link href="/auth/login">Go to sign in</Link>
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Once you&apos;ve confirmed your email, you can sign in with your
            credentials.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
