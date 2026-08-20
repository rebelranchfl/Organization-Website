import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://academy.rebelranchministries.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Rebel Ranch Academy | Real Skills for Real Life",
  description:
    "Real-life education for children, teens, and adults. Build confidence, communication, business, money, sustainability, leadership, and practical independence.",
  openGraph: {
    title: "Rebel Ranch Academy | Real Skills for Real Life",
    description:
      "Build the skills life expects. Real-life learning for capable, confident, responsible people.",
    type: "website",
    url: siteUrl,
    siteName: "Rebel Ranch Academy",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Rebel Ranch Academy — Real Skills for Real Life",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rebel Ranch Academy | Real Skills for Real Life",
    description:
      "Build the skills life expects. Real-life learning for children, teens, and adults.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/rra-logo.png",
    shortcut: "/rra-logo.png",
    apple: "/rra-logo.png",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
