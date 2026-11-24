import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "STOCKFLOW — Inventory & Supply Chain Management System",
  description:
    "Enterprise-grade inventory, multi-warehouse stock allocation, and supply chain management system powered by Next.js and Aiven PostgreSQL.",
};

export default function RootLayout({
  children,
}: ReadencodedLayoutProps<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full font-sans antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

type ReadencodedLayoutProps<T> = T;
