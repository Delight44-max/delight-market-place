"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { supabase } from "../../lib/supabase";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setIsSent(true);
            toast.success("Reset link sent!");
        } catch (error: any) {
            toast.error(error.message || "Failed to send reset link.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
            <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
                <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">Reset Password</h1>
                <p className="text-gray-500 text-sm text-center mb-8">
                    Enter your email and we'll send you a link to get back into your account.
                </p>

                {isSent ? (
                    <div className="text-center">
                        <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mb-6 text-sm">
                            Check <span className="font-bold">{email}</span> for a reset link.
                        </div>
                        <Link href="/login" className="text-blue-600 font-bold hover:underline">
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleResetRequest} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                        <div className="text-center">
                            <Link href="/login" className="text-sm text-gray-600 hover:text-blue-600">
                                Remembered your password? Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}