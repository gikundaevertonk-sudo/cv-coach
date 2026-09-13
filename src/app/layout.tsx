import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CV Coach — find jobs that fit your CV",
  description:
    "Upload your CV as a PDF and find live job vacancies that match, scored against your background. Or compare it against a specific role for a fit analysis and prep plan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col text-zinc-900 dark:text-zinc-100">
        {children}
        <footer className="mx-auto w-full max-w-3xl px-5 pb-10 pt-4 text-xs text-zinc-400 sm:px-6 dark:text-zinc-600">
          CV Coach — job matching and fit analysis from your CV. Guidance is a
          starting point, not a guarantee.
        </footer>
      </body>
    </html>
  );
}
