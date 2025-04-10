import { AuthProvider, useAuth } from "@/providers/auth-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { Toaster } from "./components/ui/sonner";
import "./globals.css";
import { router } from "./router";
import { queryClient } from "./utils/trpc";

function InnerApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InnerApp />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
