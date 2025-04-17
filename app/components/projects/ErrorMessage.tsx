import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ErrorMessage = ({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) => (
  <div className="container mx-auto max-w-3xl py-8">
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>

      <AlertDescription>
        {message}

        <Button onClick={onBack} className="mt-4" variant="outline">
          <ChevronLeft className="mr-2 h-4 w-4" /> Volver a proyectos
        </Button>
      </AlertDescription>
    </Alert>
  </div>
);

export default ErrorMessage;
