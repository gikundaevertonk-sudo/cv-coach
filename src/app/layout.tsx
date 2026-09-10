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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
