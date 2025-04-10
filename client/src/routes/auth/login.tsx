import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/auth/login")({
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await login(email, password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left Column - Images */}
      <div className="hidden md:grid grid-rows-[1fr_auto_1fr_auto_1fr] grid-cols-2 gap-4 p-6 bg-muted">
        {/* Top row images */}
        <div className="row-start-2 col-span-2 h-48 rounded-xl overflow-hidden bg-card">
          <img
            src="/api/placeholder/800/400"
            alt="Modern property exterior"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Middle row images */}
        <div className="row-start-3 col-start-1 h-40 rounded-xl overflow-hidden bg-card">
          <img
            src="/api/placeholder/400/320"
            alt="Maintenance worker"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="row-start-3 col-start-2 h-40 rounded-xl overflow-hidden bg-card">
          <img
            src="/api/placeholder/400/320"
            alt="Modern interior"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Bottom row images */}
        <div className="row-start-4 col-span-2 h-48 rounded-xl overflow-hidden bg-card">
          <img
            src="/api/placeholder/800/400"
            alt="Bright apartment interior"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
                </svg>
              </div>
              <h1 className="ml-3 text-2xl font-bold">Master Key</h1>
            </div>
            <h2 className="text-2xl font-bold">Sign in to your account</h2>
            <p className="mt-2 text-muted-foreground">
              Enter your credentials to access the property management system
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <a href="#" className="text-sm text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <a
                href="/auth/register"
                className="text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  navigate({ to: "/auth/register" });
                }}
              >
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
