
import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
    title: "VAIN Hotel - Recepción",
    description: "Panel de control para recepción",
};

export default function ReceptionLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="bg-stone-100 min-h-screen">
            {children}
        </div>
    );
}
