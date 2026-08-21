import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import CartDrawer from "@/components/cart/CartDrawer";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/layout/AuthModal";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "SnapCase — Capinhas de Celular Personalizadas com Sua Foto | Qualidade Fine Art",
  description:
    "Crie e personalize sua capa de celular com fotos em tempo real. Impressão UV Ultra-HD em silicone anti-impacto para iPhone, Samsung Galaxy e Xiaomi. Envio rápido para todo o Brasil.",
  keywords: [
    "SnapCase",
    "capinha de celular personalizada",
    "capa personalizada iphone",
    "capinha samsung personalizada",
    "personalizar capinha com foto",
    "capa anti-impacto",
    "impressao uv",
  ],
  authors: [{ name: "SnapCase Studio" }],
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="light">
      <body
        className={`${inter.variable} ${plusJakarta.variable} antialiased bg-[#fafafa] text-zinc-900 min-h-screen flex flex-col selection:bg-zinc-900 selection:text-white`}
      >
        <AuthProvider>
          <CartProvider>
            <Header />
            <CartDrawer />
            <AuthModal />
            <main className="flex-1">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
