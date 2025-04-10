import { AuthProvider, useAuth } from "@/providers/auth-provider";
import { TRPCProvider } from "@/providers/trpc-provider";
import { RouterProvider } from "@tanstack/react-router";
import { Toaster } from "./components/ui/sonner";
import "./globals.css";
import { router } from "./router";

function InnerApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

function App() {
  return (
    <TRPCProvider>
      <AuthProvider>
        <InnerApp />
        <Toaster />
      </AuthProvider>
    </TRPCProvider>
  );
}

export default App;
