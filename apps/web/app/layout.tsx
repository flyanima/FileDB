import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CompanyProvider } from "@/lib/company-context";
import { Toaster } from "@/components/ui/sonner";
import { InitialSetupModal } from "@/components/initial-setup-modal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinSight AI",
  description: "AI-Powered Financial Data Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CompanyProvider>
          <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
              <Sidebar />
            </div>
            <main className="md:pl-72 h-full">
              <Header />
              <div className="p-8 h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50">
                {children}
              </div>
            </main>
          </div>
          <InitialSetupModal />
          <Toaster />
        </CompanyProvider>
      </body>
    </html>
  );
}
