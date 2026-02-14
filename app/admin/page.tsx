"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";

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

export default function Admin() {
    const [password, setPassword] = useState("");
    const [authenticated, setAuthenticated] = useState(false);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(false);

    const checkAuth = () => {
        if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
            setAuthenticated(true);
            fetchSellers();
        } else {
            toast.error("Invalid admin password");
        }
    };

    const fetchSellers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("sellers")
            .select("*")
            .order('brand_name', { ascending: true });

        if (error) {
            toast.error("Failed to fetch sellers");
        } else {
            setSellers(data || []);
        }
        setLoading(false);
    };

    const updateSeller = async (id: string, updates: Partial<Seller>) => {
        const { error } = await supabase
            .from("sellers")
            .update(updates)
            .eq("id", id);

        if (error) {
            toast.error("Failed to update seller");
        } else {
            toast.success("Seller updated successfully");
            fetchSellers();
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
                        <button onClick={fetchSellers} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-semibold">Refresh</button>
                        <button onClick={() => setAuthenticated(false)} className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-semibold border border-red-200">Logout</button>
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
                                                {['premium', 'pro', 'elite'].includes(s.status) ? (
                                                    <img src={`/${s.status}.jpg`} alt={s.status} className="w-12 h-12 rounded-full border-2 border-white shadow-md" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold">FREE</div>
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
                                                value={s.status}
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
                                                    value={s.premium_expiry || ""}
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
                                                <input type="checkbox" className="w-5 h-5 rounded text-blue-600 border-gray-300" checked={s.is_approved} onChange={(e) => updateSeller(s.id, { is_approved: e.target.checked })} />
                                                <span className={`text-sm font-semibold ${s.is_approved ? 'text-green-600' : 'text-gray-500'}`}>Approved</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" className="w-5 h-5 rounded text-blue-600 border-gray-300" checked={s.is_paid} onChange={(e) => updateSeller(s.id, { is_paid: e.target.checked })} />
                                                <span className={`text-sm font-semibold ${s.is_paid ? 'text-blue-600' : 'text-gray-500'}`}>Mark as Paid</span>
                                            </label>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-col gap-3">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" className="w-5 h-5 rounded text-blue-600 border-gray-300" checked={s.is_active} onChange={(e) => updateSeller(s.id, { is_active: e.target.checked })} />
                                                <span className={`text-sm font-semibold ${s.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                                        {s.is_active ? 'Visible (Active)' : 'Hidden (Deactivated)'}
                                                    </span>
                                            </label>
                                            <button
                                                onClick={() => updateSeller(s.id, { is_featured: !s.is_featured })}
                                                className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${s.is_featured ? 'bg-yellow-400 text-yellow-900 border border-yellow-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            >
                                                {s.is_featured ? '★ Featured on Home' : 'Feature on Home'}
                                            </button>
                                            <button
                                                onClick={() => { if(confirm(`Remove/Deactivate ${s.brand_name}?`)) updateSeller(s.id, { is_active: false, is_approved: false }) }}
                                                className="w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold border border-red-100"
                                            >
                                                Quick Deactivate
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