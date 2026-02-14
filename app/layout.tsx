"use client";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();

    // Define pages that should NOT have the global Header/Footer
    const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";

    return (
        <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F8FAFC] text-slate-900 min-h-screen flex flex-col`}>
        <Toaster position="top-center" />

        {/* Only show Header if NOT on an Auth page */}
        {!isAuthPage && (
            <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
                <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center space-x-2">
                        <Image src="/globe.svg" alt="Logo" width={32} height={32} className="text-blue-600" />
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Seller Marketplace
                        </h1>
                    </Link>
                    <div className="hidden md:flex space-x-4">
                        <Link href="/" className="nav-link">Home</Link>
                        <Link href="/register" className="nav-link text-orange-600">Register</Link>
                        <Link href="/login" className="nav-link text-red-600">Login</Link>
                        <Link href="/dashboard" className="nav-link text-indigo-600">Dashboard</Link>
                    </div>
                </nav>
            </header>
        )}

        <main className="flex-1 flex flex-col">
            {children}
        </main>

        {/* Only show Footer if NOT on an Auth page */}
        {!isAuthPage && (
            <footer className="py-8 border-t border-slate-200 bg-white text-center">
                <div className="max-w-7xl mx-auto px-4">
                    <p className="text-slate-600 mb-4">
                        © {new Date().getFullYear()} Created by <span className="font-semibold text-blue-600">Jandiebube Eboagoro Delight</span>
                    </p>
                </div>
            </footer>
        )}

        <style jsx>{`
                    .nav-link {
                        padding: 0.5rem 1rem;
                        border-radius: 9999px;
                        font-size: 0.875rem;
                        font-weight: 500;
                        transition: all 0.3s;
                        border: 1px solid transparent;
                    }
                    .nav-link:hover {
                        background: #f1f5f9;
                        border-color: #e2e8f0;
                    }
                `}</style>
        </body>
        </html>
    );
}