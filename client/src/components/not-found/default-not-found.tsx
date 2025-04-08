import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Home, Search } from "lucide-react";

export interface NotFoundProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

export function DefaultNotFound({
  title = "Page Not Found",
  message = "Sorry, we couldn't find the page you're looking for.",
  showBackButton = true,
  showHomeButton = true,
}: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
        <Search className="h-12 w-12 text-muted-foreground" />
      </div>

      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground text-lg max-w-lg mb-8">{message}</p>

      <div className="flex flex-wrap gap-4 justify-center">
        {showBackButton && (
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        )}

        {showHomeButton && (
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
