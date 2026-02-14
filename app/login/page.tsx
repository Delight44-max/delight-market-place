"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { supabase } from "../../lib/supabase";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const router = useRouter();

    // Helper to get the correct redirect URL whether in Dev or Production
    const getRedirectUrl = () => {
        return typeof window !== "undefined"
            ? `${window.location.origin}/dashboard`
            : "http://localhost:3000/dashboard";
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password
            });

            if (error) {
                if (error.message.toLowerCase().includes("email not confirmed")) {
                    toast.error("Please verify your email address first.");
                } else {
                    toast.error(error.message);
                }
                return;
            }

            if (data?.user) {
                toast.success("Welcome back!");
                router.replace("/dashboard");
            }
        } catch (err) {
            toast.error("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleMagicLink = async () => {
        if (!email) return toast.error("Please enter your email first.");
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email.trim(),
                options: {
                    emailRedirectTo: getRedirectUrl(),
                },
            });
            if (error) throw error;
            setMagicLinkSent(true);
            toast.success("Login link sent to your email!");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center py-10 px-4">
            <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 border border-gray-200 hover:shadow-2xl transition-all duration-300">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Seller Login</h1>
                    <p className="text-gray-500 text-sm">Access your shop dashboard and manage products.</p>
                </div>

                {magicLinkSent ? (
                    <div className="text-center py-6 animate-in fade-in duration-500">
                        <div className="bg-blue-50 text-blue-700 p-4 rounded-xl mb-6 border border-blue-100">
                            Check your inbox! We sent a secure login link to <br/>
                            <span className="font-bold">{email}</span>
                        </div>
                        <button
                            onClick={() => setMagicLinkSent(false)}
                            className="text-sm text-gray-500 hover:text-blue-600 font-medium underline"
                        >
                            Back to password login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                placeholder="name@company.com"
                                className="w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-sm font-semibold text-gray-700">Password</label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    Forgot?
                                </Link>
                            </div>

                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    className="w-full border border-gray-300 rounded-lg p-3 pr-10 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-500"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "Authenticating..." : "Login"}
                        </button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500 font-medium">Or continue with</span></div>
                        </div>

                        <button
                            type="button"
                            onClick={handleMagicLink}
                            disabled={loading}
                            className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3 9H7a1 1 0 110-2h6a1 1 0 110 2z"/></svg>
                            Email Magic Link
                        </button>
                    </form>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-gray-600 text-sm">
                        New to the platform?{" "}
                        <Link href="/register" className="text-blue-600 hover:text-blue-800 font-bold transition-colors">
                            Create a Shop
                        </Link>
                    </p>
                </div>
            </div>

            <footer className="mt-10 text-gray-400 text-xs text-center">
                © 2026 by Jandiebube Eboagoro Delight <br />
                All Rights Reserved.
            </footer>
        </div>
    );
}