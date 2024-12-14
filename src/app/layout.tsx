import type { Metadata } from "next";
import "./../globals.css";

export const metadata: Metadata = {
  title: "PapaChat",
  description: "PapaChat is a chat application for CSCI 201",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body >
        {children}
      </body>
    </html>
  );
}

// className={`${geistSans.variable} ${geistMono.variable}`}
