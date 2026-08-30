import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";
import { SetupScreen } from "@/components/SetupScreen";
import { configState } from "@/config/load";
import "./globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontSerif = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cusp",
  description: "Cusp — your daily, personalized job shortlist.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const state = configState();
  return (
    <html lang="en" className={`${fontSans.variable} ${fontSerif.variable}`}>
      <body>
        {state.status === "ok" ? (
          <Providers>
            <SiteHeader />
            <main className="container max-w-[920px] py-8 pb-24 md:py-10">{children}</main>
          </Providers>
        ) : (
          <SetupScreen state={state} />
        )}
      </body>
    </html>
  );
}
