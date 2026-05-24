import type { Metadata } from "next";
import { Poppins, Cairo } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { CartProvider } from "@/context/CartContext";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "JudyTech — Store",
  description: "JudyTech online store — browse and order your favorites.",
  keywords: ["JudyTech", "store", "online shop"],
  openGraph: {
    title: "JudyTech Store",
    description: "Order your favorites online",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <body className={`${poppins.variable} ${cairo.variable} antialiased bg-bg text-ink min-h-screen`}>
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
