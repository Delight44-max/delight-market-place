"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "react-hot-toast";
import { deleteMyAuthAccount } from "@/lib/selfProfileDeleteAction";

interface Product {
    id: string;
    image_url: string;
    video_url?: string;
    description: string;
    price: number;
    currency: string;
}

interface Seller {
    id: string;
    status: string;
    brand_name: string;
    bio?: string;
    profile_pic_url?: string;
    ceo_name?: string;
    category?: string;
}

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const [seller, setSeller] = useState<Seller | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [form, setForm] = useState({ image: null as File | null, description: "", price: "", currency: "NGN" });
    const [editProduct, setEditProduct] = useState<(Product & { price: number | string }) | null>(null);
    const [profileForm, setProfileForm] = useState({ bio: "" });
    const [loading, setLoading] = useState(false);
    const [initialFetchDone, setInitialFetchDone] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const router = useRouter();

    const SHIPPING_URL = process.env.NEXT_PUBLIC_SHIPPING_URL || "https://giglogistics.com";
    const ADMIN_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "2348000000000";

    const plans = [
        {
            name: 'Premium',
            price: 5000,
            features: ['Visible to customers', 'Priority listing', 'Premium badge', 'Image uploads'],
            color: 'from-amber-400 to-yellow-500',
            icon: '⭐'
        },
        {
            name: 'Pro',
            price: 12500,
            features: ['All Premium features', 'Higher ranking', 'Pro badge'],
            color: 'from-purple-600 to-indigo-600',
            icon: '💎'
        },
        {
            name: 'Elite',
            price: 25000,
            features: ['All Pro features', 'Homepage featured', 'Verified badge', 'Top placement'],
            color: 'from-red-600 to-pink-600',
            icon: '👑'
        }
    ];

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error || !user) {
                    router.replace("/login");
                    return;
                }
                setUser(user);
                await Promise.all([
                    fetchSeller(user.id),
                    fetchProducts(user.id)
                ]);
            } catch (err) {
                console.error("Auth error:", err);
            } finally {
                setInitialFetchDone(true);
            }
        };
        checkAuthAndFetch();
    }, [router]);

    const fetchSeller = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("sellers")
                .select("*")
                .eq("id", userId)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setSeller(data);
                setProfileForm({ bio: data.bio || "" });
            } else {
                setSeller(null);
            }
        } catch (error: any) {
            console.error("Seller Fetch Error:", error.message);
            toast.error("Could not load profile.");
        }
    };

    const fetchProducts = async (userId: string) => {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("seller_id", userId)
            .order('created_at', { ascending: false });

        if (!error) setProducts(data || []);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setForm({ ...form, image: file });
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.image) return toast.error("Please select an image");
        setLoading(true);
        try {
            const imageUrl = await uploadToCloudinary(form.image, 'products');

            const { error } = await supabase.from("products").insert({
                seller_id: user.id,
                image_url: imageUrl,
                description: form.description,
                price: parseFloat(form.price),
                currency: form.currency,
            });

            if (error) throw error;

            toast.success("Product listed successfully!");
            setForm({ image: null, description: "", price: "", currency: "NGN" });
            setImagePreview(null);
            fetchProducts(user.id);
        } catch (error: any) {
            toast.error(error.message || "Upload failed");
        } finally {
            setLoading(false);
        }
    };

    const handleEditProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editProduct) return;
        setLoading(true);

        try {
            // Extract price once to help TypeScript narrow properly
            const currentPrice = editProduct.price;

            let finalPrice: number = 0;


            if (typeof currentPrice === 'string') {
            //@ts-ignore
                const trimmed = currentPrice.trim();
                finalPrice = trimmed === '' ? 0 : Number(trimmed);
            } else {
                finalPrice = currentPrice;
            }


            if (isNaN(finalPrice)) {
                finalPrice = 0;
            }

            const { error } = await supabase
                .from("products")
                .update({
                    description: editProduct.description,
                    price: finalPrice,
                    currency: editProduct.currency,
                })
                .eq("id", editProduct.id);

            if (error) throw error;

            toast.success("Product updated!");
            setEditProduct(null);
            fetchProducts(user.id);
        } catch (error: any) {
            toast.error("Update failed");
            console.error("Product update error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        const confirmProductDelete = () => new Promise<boolean>((resolve) => {
            toast((t) => (
                <div className="flex flex-col gap-3 w-80 p-4 bg-white rounded-xl border border-red-300 shadow-xl">
                    <p className="text-lg font-bold text-red-700 text-center">Delete Product?</p>
                    <p className="text-sm text-center">
                        Are you sure you want to permanently delete this product?
                    </p>
                    <p className="text-xs text-gray-600 text-center">
                        This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => { toast.dismiss(t.id); resolve(false); }}
                            className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => { toast.dismiss(t.id); resolve(true); }}
                            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold"
                        >
                            Yes, Delete
                        </button>
                    </div>
                </div>
            ), { duration: Infinity, position: "top-center" });
        });

        const shouldDelete = await confirmProductDelete();
        if (!shouldDelete) return;

        toast.loading("Deleting product...");

        const { error } = await supabase.from("products").delete().eq("id", id);

        toast.dismiss();

        if (error) {
            toast.error("Delete failed");
        } else {
            toast.success("Product removed");
            fetchProducts(user.id);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase
            .from("sellers")
            .update({ bio: profileForm.bio })
            .eq("id", user.id);

        if (error) toast.error("Profile update failed");
        else {
            toast.success("Bio updated!");
            fetchSeller(user.id);
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace("/login");
    };

    const handleSelectPlan = (planName: string, price: number) => {
        const msg = `Hi Admin! I'm ${seller?.brand_name} (CEO: ${seller?.ceo_name}). I want to upgrade to the ${planName} plan (₦${price.toLocaleString()}/month). Please activate my account.`;
        window.open(`https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
        setShowPlanModal(false);
        toast.success("Opening WhatsApp... Please complete payment with admin.");
    };

    // ────────────────────────────────────────────────
    // Delete My Account (seller profile + auth user)
    // ────────────────────────────────────────────────
    const handleDeleteAccount = async () => {
        const confirmDelete = () => new Promise<boolean>((resolve) => {
            toast((t) => (
                <div className="flex flex-col gap-4 w-96 p-6 bg-white rounded-2xl border-2 border-red-500 shadow-2xl">
                    <p className="text-xl font-bold text-red-700 text-center">
                        ⚠️ DELETE MY ACCOUNT FOREVER
                    </p>
                    <p className="text-base text-center font-semibold text-gray-800">
                        This will permanently delete:
                    </p>
                    <ul className="text-sm text-gray-700 list-disc pl-6 space-y-1">
                        <li>Your seller profile</li>
                        <li>All your listed products</li>
                        <li>Your login account (you won't be able to log in again)</li>
                    </ul>
                    <p className="text-xs text-red-600 font-medium text-center">
                        This action is IRREVERSIBLE — no recovery possible!
                    </p>
                    <div className="flex gap-4 mt-4">
                        <button
                            onClick={() => { toast.dismiss(t.id); resolve(false); }}
                            className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl text-sm font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => { toast.dismiss(t.id); resolve(true); }}
                            className="flex-1 py-3 bg-red-600 hover:bg-red-800 text-white rounded-xl text-sm font-bold"
                        >
                            Yes, Delete Everything
                        </button>
                    </div>
                </div>
            ), {
                duration: Infinity,
                position: "top-center",
                style: { maxWidth: '450px' }
            });
        });

        const shouldDelete = await confirmDelete();
        if (!shouldDelete) return;

        toast.loading("Deleting your account permanently... This may take a moment");

        try {
            // Step 1: Delete seller profile
            const { error: sellerError } = await supabase
                .from("sellers")
                .delete()
                .eq("id", user.id);

            if (sellerError) throw sellerError;

            // Step 2: Delete auth user using Server Action
            const authResult = await deleteMyAuthAccount();

            if (!authResult.success) {
                throw new Error(authResult.error || "Failed to delete auth account");
            }

            toast.dismiss();
            toast.success("Your account has been permanently deleted");

            await supabase.auth.signOut();
            router.replace("/login");
        } catch (err: any) {
            toast.dismiss();
            toast.error(`Deletion failed: ${err.message}`);
            console.error("Account delete error:", err);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'elite':
                return (
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs font-black tracking-wider uppercase shadow-lg">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        ELITE
                    </div>
                );
            case 'pro':
                return (
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black tracking-wider uppercase shadow-lg">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        PRO
                    </div>
                );
            case 'premium':
                return (
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 text-xs font-black tracking-wider uppercase shadow-lg">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        PREMIUM
                    </div>
                );
            default:
                return (
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gray-200 text-gray-700 text-xs font-black tracking-wider uppercase">
                        FREE
                    </div>
                );
        }
    };

    if (!initialFetchDone) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        </div>
                    </div>
                    <p className="text-gray-600 font-semibold">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (!seller) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
                <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Profile Incomplete</h2>
                    <p className="text-gray-600 mb-8">We couldn't find your seller profile. Please try logging in again.</p>
                    <button onClick={handleLogout} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold hover:shadow-lg transition-all">
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-20">
            {/* Top Navigation Bar */}
            <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        </div>
                        <span className="text-xl font-black text-gray-900">Seller Dashboard</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 mt-8">
                {/* Profile Header Card */}
                <div className="bg-white rounded-3xl border border-gray-200 p-8 mb-8 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full -mr-32 -mt-32 opacity-50"></div>

                    <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
                        {/* Profile Picture */}
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 flex-shrink-0 shadow-lg">
                            {seller.profile_pic_url ? (
                                <img src={seller.profile_pic_url} alt={seller.brand_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-blue-300">
                                    {seller.brand_name.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Brand Info */}
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h1 className="text-3xl md:text-4xl font-black text-gray-900">{seller.brand_name}</h1>
                                {getStatusBadge(seller.status)}
                            </div>
                            <p className="text-gray-600 text-sm mb-1">
                                <span className="font-semibold">CEO:</span> {seller.ceo_name}
                            </p>
                            {seller.category && (
                                <p className="text-gray-500 text-sm mb-3">
                                    <span className="font-semibold">Category:</span> {seller.category}
                                </p>
                            )}
                            <p className="text-gray-600 max-w-2xl leading-relaxed">
                                {seller.bio || "Add a bio to help customers connect with your brand."}
                            </p>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <button
                                onClick={() => setShowPlanModal(true)}
                                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                {seller.status?.toLowerCase() === 'elite' ? 'View Plans' : 'Upgrade Plan'}
                            </button>
                            <button
                                onClick={() => window.open(SHIPPING_URL, '_blank')}
                                className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:border-blue-400 hover:text-blue-600 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                Ship Products
                            </button>

                            {/* Delete My Account Button */}
                            <button
                                onClick={handleDeleteAccount}
                                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-800 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all mt-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete My Account
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Edit Bio Card */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                            <div className="flex items-center gap-2 mb-4">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                <h2 className="text-lg font-bold text-gray-900">Edit Bio</h2>
                            </div>
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <textarea
                                    value={profileForm.bio}
                                    onChange={(e) => setProfileForm({ bio: e.target.value })}
                                    className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
                                    placeholder="Tell customers about your brand, products, and what makes you special..."
                                    rows={5}
                                    maxLength={300}
                                />
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                    <span>{profileForm.bio.length}/300 characters</span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Saving..." : "Save Bio"}
                                </button>
                            </form>
                        </div>

                        {/* Stats Card */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                            <h3 className="font-bold text-lg mb-4">Your Stats</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-white/10 rounded-xl p-3 backdrop-blur">
                                    <span className="text-sm font-medium">Total Products</span>
                                    <span className="text-2xl font-black">{products.length}</span>
                                </div>
                                <div className="flex items-center justify-between bg-white/10 rounded-xl p-3 backdrop-blur">
                                    <span className="text-sm font-medium">Plan Status</span>
                                    <span className="text-sm font-black uppercase">{seller.status || 'Free'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Logistics Card */}
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
                            <div className="flex items-center gap-2 mb-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                <h3 className="font-bold text-lg">Need Shipping?</h3>
                            </div>
                            <p className="text-green-100 text-sm mb-4">Fast & reliable delivery for your products across Nigeria.</p>
                            <button
                                onClick={() => window.open(SHIPPING_URL, '_blank')}
                                className="w-full bg-white text-green-600 py-3 rounded-xl font-bold hover:bg-green-50 transition-all"
                            >
                                Contact Shipping Partner
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Add Product Card */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-lg">
                            <div className="flex items-center gap-2 mb-6">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
                            </div>

                            <form onSubmit={handleUpload} className="space-y-6">
                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">Product Image *</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            className="hidden"
                                            id="product-image"
                                            required
                                        />
                                        <label
                                            htmlFor="product-image"
                                            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all bg-gray-50"
                                        >
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    <p className="text-sm font-semibold text-gray-600">Click to upload image</p>
                                                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">Product Description *</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        className="w-full border-2 border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
                                        placeholder="Describe your product in detail..."
                                        rows={3}
                                        required
                                    />
                                </div>

                                {/* Price & Currency */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-3">Price *</label>
                                        <input
                                            type="number"
                                            value={form.price}
                                            onChange={(e) => setForm({
                                                ...form,
                                                price: e.target.value
                                            })}
                                            className="w-full border-2 border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            placeholder="0.00"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-3">Currency *</label>
                                        <select
                                            value={form.currency}
                                            onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                            className="w-full border-2 border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold cursor-pointer"
                                        >
                                            <option value="NGN">₦ NGN</option>
                                            <option value="USD">$ USD</option>
                                            <option value="GBP">£ GBP</option>
                                            <option value="EUR">€ EUR</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Uploading...
                                        </span>
                                    ) : (
                                        "Publish Product"
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Product Inventory */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-lg">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                    <h2 className="text-xl font-bold text-gray-900">Your Products ({products.length})</h2>
                                </div>
                            </div>

                            {products.length === 0 ? (
                                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center bg-gray-50">
                                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Products Yet</h3>
                                    <p className="text-gray-500 text-sm">Start adding products to grow your shop!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {products.map((product) => (
                                        <div key={product.id} className="group bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-blue-400 hover:shadow-lg transition-all">
                                            <div className="relative h-48 bg-white flex items-center justify-center overflow-hidden p-2">
                                                <img
                                                    src={product.image_url}
                                                    alt={product.description}
                                                    className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                                                />
                                                {product.video_url && (
                                                    <div className="absolute top-3 right-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                                                        Video
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <p className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                                                    {product.description}
                                                </p>
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-xl font-black text-blue-600">
                                                        {product.currency} {product.price.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setEditProduct(product)}
                                                        className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(product.id)}
                                                        className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl font-bold text-sm hover:bg-red-100 transition-all"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Plan Selection Modal */}
            {showPlanModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in overflow-y-auto">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-4xl shadow-2xl transform animate-in zoom-in my-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900">Choose Your Plan</h3>
                                <p className="text-gray-600 mt-2">Select the perfect plan for your business growth</p>
                            </div>
                            <button
                                onClick={() => setShowPlanModal(false)}
                                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {plans.map((plan) => (
                                <div
                                    key={plan.name}
                                    className={`relative rounded-2xl p-6 border-2 ${
                                        seller.status?.toLowerCase() === plan.name.toLowerCase()
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 bg-white hover:border-blue-300'
                                    } transition-all`}
                                >
                                    {seller.status?.toLowerCase() === plan.name.toLowerCase() && (
                                        <div className="absolute -top-3 -right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                            Current Plan
                                        </div>
                                    )}

                                    <div className="text-center mb-6">
                                        <div className="text-5xl mb-3">{plan.icon}</div>
                                        <h4 className="text-2xl font-black text-gray-900 mb-2">{plan.name}</h4>
                                        <div className="flex items-baseline justify-center gap-1">
                                            <span className="text-3xl font-black text-gray-900">₦{plan.price.toLocaleString()}</span>
                                            <span className="text-gray-500 text-sm">/month</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-3 mb-6">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleSelectPlan(plan.name, plan.price)}
                                        disabled={seller.status?.toLowerCase() === plan.name.toLowerCase()}
                                        className={`w-full py-3 px-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                                            seller.status?.toLowerCase() === plan.name.toLowerCase()
                                                ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                                                : `bg-gradient-to-r ${plan.color} text-white hover:shadow-lg hover:scale-105`
                                        }`}
                                    >
                                        {seller.status?.toLowerCase() === plan.name.toLowerCase() ? (
                                            'Active'
                                        ) : (
                                            <>
                                                Activate
                                                <svg className="w-5 h-5 fill-current text-green-500" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                            <div className="flex items-start gap-3">
                                <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <div>
                                    <h5 className="font-bold text-blue-900 mb-1">How Payment Works</h5>
                                    <p className="text-sm text-blue-800">
                                        After selecting a plan, you'll be redirected to WhatsApp to contact our admin.
                                        Complete payment and your account will be upgraded within 24 hours.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
            {editProduct && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl transform animate-in zoom-in">
                        <div className="flex items-center justify-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Edit Product</h3>
                            <button
                                onClick={() => setEditProduct(null)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all ml-auto"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleEditProduct} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                <textarea
                                    className="w-full border-2 border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                    value={editProduct.description}
                                    onChange={(e) => setEditProduct(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Price</label>
                                    <input
                                        type="number"
                                        className="w-full border-2 border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        value={editProduct.price ?? ""}
                                        onChange={(e) => {
                                            const inputValue = e.target.value;
                                       // @ts-ignore
                                            setEditProduct(prev => ({
                                                ...prev,
                                                price: inputValue === "" ? "" : Number(inputValue)
                                            }));
                                        }}
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Currency</label>
                                    <select
                                        className="w-full border-2 border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-semibold"
                                        value={editProduct.currency}
                                        onChange={(e) => setEditProduct(prev => ({ ...prev, currency: e.target.value }))}
                                    >
                                        <option value="NGN">₦ NGN</option>
                                        <option value="USD">$ USD</option>
                                        <option value="GBP">£ GBP</option>
                                        <option value="EUR">€ EUR</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {loading ? "Updating..." : "Save Changes"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditProduct(null)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="mt-16 text-center text-gray-500 text-sm pb-8">
                <p>© 2026 Created by <span className="font-bold text-gray-700">Jandiebube Eboagoro Delight</span></p>
            </footer>
        </div>
    );
}