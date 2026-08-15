import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealScribe — calls into CRM records",
  description:
    "Turn sales call transcripts into reviewed CRM updates without typing them in.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-ink-200 bg-white">
            <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-3">
              <Link href="/" className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="grid h-7 w-7 place-items-center rounded bg-ink-900 text-xs font-bold text-white"
                >
                  DS
                </span>
                <span className="text-[15px] font-semibold tracking-tight">
                  DealScribe
                </span>
              </Link>

              <nav className="flex items-center gap-1 text-sm">
                <Link
                  href="/"
                  className="rounded px-3 py-1.5 text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                >
                  Workbench
                </Link>
                <Link
                  href="/crm"
                  className="rounded px-3 py-1.5 text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                >
                  CRM
                </Link>
              </nav>

              <p className="ml-auto hidden text-xs text-ink-500 sm:block">
                Call transcript in, reviewed CRM record out
              </p>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
