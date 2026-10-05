import type { Metadata } from "next";
import { AuthGate } from "@/components/AuthGate";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dielňa · (Ne)potrebný muž",
  description: "Pracovný nástroj na písanie knihy (Ne)potrebný muž",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sk" className="h-full antialiased">
      <body className="min-h-full">
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
