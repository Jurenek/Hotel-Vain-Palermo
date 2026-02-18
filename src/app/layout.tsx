import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "VAIN Boutique Hotel | Palermo Soho",
    description: "Tu experiencia premium en el corazón de Buenos Aires",
    manifest: "/manifest.json",
    viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
    themeColor: "#171717",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={`${inter.className} antialiased`}>
                <div className="max-w-md mx-auto bg-white shadow-2xl min-h-screen relative">
                    {children}
                </div>
            </body>
        </html>
    );
}
