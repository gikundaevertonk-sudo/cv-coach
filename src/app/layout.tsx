import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CV Coach — interview prep from your CV and the role",
  description:
    "Paste your CV and a job description to get a fit analysis, a prep plan, and tailored practice questions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col text-zinc-900 dark:text-zinc-100">
        {children}
        <footer className="mx-auto w-full max-w-3xl px-5 pb-10 pt-4 text-xs text-zinc-400 sm:px-6 dark:text-zinc-600">
          CV Coach compares one CV against one role. Guidance is a starting
          point, not a guarantee.
        </footer>
      </body>
    </html>
  );
}
