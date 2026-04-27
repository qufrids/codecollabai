import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeCollab AI",
  description: "Collaborative AI-powered coding platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
