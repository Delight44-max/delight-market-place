"use client";
import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { toast } from "react-hot-toast";
import { deleteSellerProfile } from "@/lib/deleteSellerAction";

interface Seller {
    id: string;
    brand_name: string;
    status: string;
    premium_expiry: string | null;
    is_approved: boolean;
    is_active: boolean;
    is_featured: boolean;
    is_paid: boolean;
    whatsapp: string;
}

// Admin client with anon key
const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

export default function Admin() {
    const [password, setPassword] = useState("");
    const [authenticated, setAuthenticated] = useState(false);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(false);

    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

    const checkAuth = () => {
        if (password === ADMIN_PASSWORD) {
            setAuthenticated(true);
            fetchSellers();
        } else {
            toast.error("Invalid admin password");
        }
    };

    const fetchSellers = async () => {
        setLoading(true);
        const adminClient = getAdminClient();

        const { data, error } = await adminClient
            .from("sellers")
            .select("*")
            .order('brand_name', { ascending: true });

        if (error) {
            console.error("Fetch error:", error);
            toast.error("Failed to fetch sellers");
        } else {
            setSellers(data || []);
        }
        setLoading(false);
    };

    const updateSeller = async (id: string, updates: Partial<Seller>) => {
        console.log("Updating seller:", id, "with:", updates);

        const adminClient = getAdminClient();

        const { data, error } = await adminClient
            .from("sellers")
            .update(updates)
            .eq("id", id)
            .select();

        if (error) {
            console.error("Update error:", error);
            toast.error(`Failed to update: ${error.message}`);
        } else {
            console.log("Update successful:", data);
            toast.success("Seller updated successfully");
            fetchSellers();
        }
    };

    const handleDeleteSeller = async (seller: Seller) => {
        // Toast-based confirmation (no native alert)
        const confirmDelete = () => new Promise<boolean>((resolve) => {
            toast((t) => (
                <div className="flex flex-col gap-4 w-80 p-4 bg-white rounded-xl border border-red-300 shadow-xl">
                    <p className="text-lg font-bold text-red-700 text-center">
                        ⚠️ PERMANENT DELETE WARNING
                    </p>
                    <p className="text-sm text-center">
                        Are you sure you want to <strong>permanently delete</strong> the seller profile of
                        <br />
                        <strong>"{seller.brand_name}"</strong>?
                    </p>
                    <p className="text-xs text-gray-600 text-center">
                        This will remove their record from the sellers table.<br />
                        This action <strong>CANNOT</strong> be undone!
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                resolve(false);
                            }}
                            className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                resolve(true);
                            }}
                            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold"
                        >
                            Yes, Delete Permanently
                        </button>
                    </div>
                </div>
            ), {
                duration: Infinity,
                position: "top-center",
                style: {
                    maxWidth: '400px',
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px'
                }
            });
        });

        const shouldDelete = await confirmDelete();

        if (!shouldDelete) return;

        toast.loading("Deleting seller profile...");

        const result = await deleteSellerProfile(seller.id);

        toast.dismiss();

        if (result.success) {
            toast.success(result.message ?? "Seller profile deleted successfully");
            fetchSellers();
        } else {
            toast.error(`Failed to delete: ${result.error}`);
            console.error("Delete failed:", result.error);
        }
    };

    const sendExpiryAlert = (seller: Seller) => {
        const message = "Your Subscription has expired, kindly Subscribe to continue enjoying the service";
        const whatsappUrl = `https://wa.me/${seller.whatsapp}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
        toast.success("Alert message prepared for WhatsApp");
    };

    const isExpiringSoon = (expiryStr: string | null) => {
        if (!expiryStr) return false;
        const expiry = new Date(expiryStr);
        const today = new Date();
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 14 && diffDays > 0;
    };

    if (!authenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Admin Access</h2>
                    <input
                        type="password"
                        placeholder="Enter Admin Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && checkAuth()}
                        className="w-full p-4 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <button
                        onClick={checkAuth}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg"
                    >
                        Login to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                    <h1 className="text-4xl font-extrabold text-gray-900">Admin Control Panel</h1>
                    <div className="flex gap-4">
                        <button onClick={fetchSellers} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-semibold">
                            Refresh
                        </button>
                        <button onClick={() => setAuthenticated(false)} className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-semibold border border-red-200">
                            Logout
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 border-b border-gray-200">
                            <tr>
                                <th className="p-5 font-bold text-gray-700">Seller & Badge</th>
                                <th className="p-5 font-bold text-gray-700">Subscription & Expiry</th>
                                <th className="p-5 font-bold text-gray-700">Status Controls</th>
                                <th className="p-5 font-bold text-gray-700">Visibility & Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {sellers.map((s) => (
                                <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-shrink-0">
                                                {['premium', 'pro', 'elite'].includes(s.status?.toLowerCase()) ? (
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                                        s.status?.toLowerCase() === 'elite' ? 'bg-gradient-to-r from-red-600 to-pink-600' :
                                                            s.status?.toLowerCase() === 'pro' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' :
                                                                'bg-gradient-to-r from-amber-400 to-yellow-500'
                                                    }`}>
                                                        {s.status?.substring(0, 1).toUpperCase()}
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold">
                                                        FREE
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 text-lg">{s.brand_name}</div>
                                                <div className="text-xs text-gray-500 font-mono">{s.id.slice(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="space-y-3">
                                            <select
                                                value={s.status || 'free'}
                                                onChange={(e) => updateSeller(s.id, { status: e.target.value })}
                                                className="w-full p-2 bg-white border border-gray-300 rounded-lg text-sm font-medium"
                                            >
                                                <option value="free">Free Plan</option>
                                                <option value="premium">Premium Status</option>
                                                <option value="pro">Pro Status</option>
                                                <option value="elite">Elite Status</option>
                                            </select>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase">Expiration Date</label>
                                                <input
                                                    type="date"
                                                    value={s.premium_expiry ? s.premium_expiry.split('T')[0] : ""}
                                                    onChange={(e) => updateSeller(s.id, { premium_expiry: e.target.value })}
                                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                                />
                                            </div>
                                            {isExpiringSoon(s.premium_expiry) && (
                                                <button
                                                    onClick={() => sendExpiryAlert(s)}
                                                    className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider animate-pulse"
                                                >
                                                    ⚠️ Send 14-Day Alert
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-col gap-3">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                                                    checked={s.is_approved || false}
                                                    onChange={(e) => {
                                                        console.log("Approved checkbox clicked:", e.target.checked);
                                                        updateSeller(s.id, { is_approved: e.target.checked });
                                                    }}
                                                />
                                                <span className={`text-sm font-semibold ${s.is_approved ? 'text-green-600' : 'text-gray-500'}`}>
                                                        Approved
                                                    </span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                                                    checked={s.is_paid || false}
                                                    onChange={(e) => {
                                                        console.log("Paid checkbox clicked:", e.target.checked);
                                                        updateSeller(s.id, { is_paid: e.target.checked });
                                                    }}
                                                />
                                                <span className={`text-sm font-semibold ${s.is_paid ? 'text-blue-600' : 'text-gray-500'}`}>
                                                        Mark as Paid
                                                    </span>
                                            </label>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-col gap-3">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                                                    checked={s.is_active !== false}
                                                    onChange={(e) => {
                                                        console.log("Active checkbox clicked:", e.target.checked);
                                                        updateSeller(s.id, { is_active: e.target.checked });
                                                    }}
                                                />
                                                <span className={`text-sm font-semibold ${s.is_active !== false ? 'text-green-600' : 'text-red-600'}`}>
                                                        {s.is_active !== false ? 'Visible (Active)' : 'Hidden (Deactivated)'}
                                                    </span>
                                            </label>
                                            <button
                                                onClick={() => {
                                                    console.log("Feature button clicked, current:", s.is_featured);
                                                    updateSeller(s.id, { is_featured: !s.is_featured });
                                                }}
                                                className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                                                    s.is_featured ? 'bg-yellow-400 text-yellow-900 border border-yellow-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                {s.is_featured ? '★ Featured on Home' : 'Feature on Home'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Remove/Deactivate ${s.brand_name}?`)) {
                                                        updateSeller(s.id, { is_active: false, is_approved: false });
                                                    }
                                                }}
                                                className="w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold border border-red-100"
                                            >
                                                Quick Deactivate
                                            </button>

                                            {/* DELETE PROFILE BUTTON */}
                                            <button
                                                onClick={() => handleDeleteSeller(s)}
                                                className="w-full py-2 bg-red-600 hover:bg-red-800 text-white rounded-lg text-xs font-bold mt-2 shadow-md transition-colors"
                                            >
                                                🗑️ Delete Profile
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    {sellers.length === 0 && !loading && (
                        <div className="p-20 text-center">
                            <p className="text-gray-500 text-lg">No sellers found in the database.</p>
                        </div>
                    )}
                    {loading && (
                        <div className="p-20 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-500">Loading sellers...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}