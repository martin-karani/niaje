import { LoginForm } from "@/auth/components/login-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  return (
    <div className="p-2">
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex w-full max-w-4xl">
          <div className="hidden md:flex md:w-1/2 bg-primary items-center justify-center rounded-l-lg">
            <div className="p-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Property Management System
              </h2>
              <p className="text-primary-foreground">
                Efficiently manage your properties, tenants, and finances all in
                one place.
              </p>
            </div>
          </div>
          <div className="w-full md:w-1/2 flex items-center justify-center p-4">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
