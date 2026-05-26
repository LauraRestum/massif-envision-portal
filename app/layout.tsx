import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Massif Program Pipeline — Envision",
  description:
    "Every active opportunity, every program milestone, in one view. Shared between Envision and Massif.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
