import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { EnvielTopNav } from "@/components/layout/EnvielTopNav";
import { EnvielFloatingDock } from "@/components/layout/EnvielFloatingDock";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EnvielStream",
  description: "Professional Anime Streaming Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <div className="relative min-h-screen pb-24 md:pb-0">
             <EnvielTopNav />
             <main>
               {children}
             </main>
             <EnvielFloatingDock />
          </div>
        </Providers>
      </body>
    </html>
  );
}
