import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Home } from "lucide-react";

interface DefaultNotFoundProps {
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
}

export function DefaultNotFound({
  title,
  message,
  resourceType,
  resourceId,
}: DefaultNotFoundProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl font-bold text-muted-foreground">404</span>
      </div>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground max-w-md mb-6">{message}</p>

      {resourceType && (
        <p className="text-sm text-muted-foreground mb-6">
          {`${resourceType}${
            resourceId ? ` (ID: ${resourceId})` : ""
          } was not found.`}
        </p>
      )}

      <Button onClick={() => navigate({ to: "/" })}>
        <Home className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
    </div>
  );
}
