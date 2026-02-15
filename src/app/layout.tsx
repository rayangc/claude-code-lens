import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claude Code Lens",
  description: "Observe and analyze Claude Code sessions",
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased font-mono max-w-[100vw] overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
