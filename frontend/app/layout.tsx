import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { MainNav } from "@/components/main-nav";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Présences des stagiaires", template: "%s · Présences des stagiaires" },
  description: "Pointage quotidien des stagiaires (présent, absent, en retard), historique et bilan par période.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow-sm"
        >
          Aller au contenu
        </a>
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2">
            <Link href="/" className="text-lg font-semibold">
              Présences des stagiaires
            </Link>
            <MainNav />
          </div>
        </header>
        <main id="main-content" className="mx-auto w-full max-w-4xl px-4 py-6 lg:py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
