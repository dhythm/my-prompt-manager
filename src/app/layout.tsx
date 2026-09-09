import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt Manager",
  description: "Manage prompts with PostgreSQL or PGlite",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
