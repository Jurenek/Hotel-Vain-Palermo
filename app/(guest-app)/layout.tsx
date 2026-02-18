
export default function GuestLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="max-w-md mx-auto bg-white shadow-2xl min-h-screen relative">
            {children}
        </div>
    );
}
