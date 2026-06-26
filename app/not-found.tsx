import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Page not found</AlertTitle>

        <AlertDescription>
          We couldn&apos;t find the page you&apos;re looking for.
          <Link href="/">
            <Button className="mt-4" variant="outline">
              <ChevronLeft className="h-4 w-4" /> Back home
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    </div>
  );
}
