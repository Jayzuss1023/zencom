import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

// Distinctive editorial display face — used for marketing hero/section headlines.
// Geist stays the UI/body workhorse; Instrument Serif adds character to the
// surfaces a visitor sees first.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  title: {
    default: "MyChat — AI customer support desk",
    template: "%s · MyChat",
  },
  description:
    "An AI customer-support desk: embeddable chat + helpdesk widget, website crawler, lead capture, and a shared team inbox with human takeover.",
};

// Root layout is intentionally Clerk-free. Clerk wraps only the dashboard
// (see app/(app)/layout.tsx) so the widget can run anonymously on customer sites.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        "font-sans antialiased",
        geist.variable,
        geistMono.variable,
        instrumentSerif.variable,
      )}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
