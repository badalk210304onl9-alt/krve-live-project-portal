import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KRVÉ Live Project Portal",
  description:
    "Student workspace for the KRVÉ Live Business Project Program.",
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
