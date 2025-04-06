import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/providers/auth-provider";
import { TRPCProvider } from "@/providers/trpc-provider";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://property-manager.co.ke/"),
  title: {
    default: "Kenya Property Manager",
    template: `%s | Kenya Property Manager`,
  },
  description:
    "Property management system for Kenyan landlords, caretakers, and agents. Manage properties, tenants, and payments with ease.",
  openGraph: {
    description:
      "Property management system for Kenyan landlords, caretakers, and agents. Manage properties, tenants, and payments with ease.",
    images: ["/images/og-image.png"],
    url: "https://property-manager.co.ke/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kenya Property Manager",
    description:
      "Property management system for Kenyan landlords, caretakers, and agents. Manage properties, tenants, and payments with ease.",
    creator: "@kenyapropertymanager",
    images: ["/images/twitter-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={GeistSans.className}>
        <AuthProvider>
          <TRPCProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="relative min-h-screen flex flex-col">
                {/* <MainNavigation /> */}
                <main className="flex-1">{children}</main>
              </div>
              <Toaster />
            </ThemeProvider>
          </TRPCProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
