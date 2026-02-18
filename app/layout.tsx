import type { Metadata, Viewport } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
    variable: "--font-heading",
});

const montserrat = Montserrat({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600"],
    display: "swap",
    variable: "--font-body",
});

export const metadata: Metadata = {
    title: "VAIN Boutique Hotel | Palermo Soho",
    description: "Tu experiencia premium en el corazón de Buenos Aires",
    manifest: "/manifest.json",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#171717",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={`${montserrat.variable} ${playfair.variable} ${montserrat.className} antialiased`}>
                {children}
            </body>
        </html>
    );
}
