import LoginPage from "@/pages/auth/login-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  return (
    <div className="p-2">
      <LoginPage />
    </div>
  );
}
