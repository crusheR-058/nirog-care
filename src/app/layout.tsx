import type { Metadata, Viewport } from "next";
import { Inter, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Display face matched to the patient app's friendly extra-bold headings.
const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Nirog — Continuous care platform",
    template: "%s · Nirog",
  },
  description:
    "Nirog connects rural patients to trusted clinicians through voice-first AI intake, a responsive doctor workspace, and consent-driven health records.",
  applicationName: "Nirog",
};

export const viewport: Viewport = {
  themeColor: "#d9e5f6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Light mode only — no theme switching.
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${manrope.variable} ${mono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
