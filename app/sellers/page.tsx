"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Seller {
    id: string;
    brand_name: string;
    ceo_name: string;
    whatsapp: string;
    bio: string;
    status: string;
    category: string;
    country: string;
    state: string;
    profile_pic_url?: string;
    is_paid?: boolean;
}

export default function Sellers() {
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [filteredSellers, setFilteredSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");

    const categories = ["All", "Fashion", "Electronics", "Food / Groceries", "Services"];
    const SHIPPING_URL = process.env.NEXT_PUBLIC_SHIPPING_URL || "https://giglogistics.com";

    useEffect(() => {
        const fetchSellers = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("sellers")
                .select("*")
                .eq('is_active', true)
                .eq('is_approved', true)
                .order('status', { ascending: false });

            if (!error && data) {
                // Sort by: 1) Paid status (paid first), 2) Plan tier (elite/pro/premium/free), 3) Brand name
                const sortedData = data.sort((a, b) => {
                    // First priority: Paid sellers come first
                    if (a.is_paid && !b.is_paid) return -1;
                    if (!a.is_paid && b.is_paid) return 1;

                    // Second priority: Status tier (elite > pro > premium > free)
                    const statusOrder: Record<string, number> = { elite: 1, pro: 2, premium: 3, free: 4 };
                    const statusDiff = (statusOrder[a.status?.toLowerCase()] || 99) - (statusOrder[b.status?.toLowerCase()] || 99);
                    if (statusDiff !== 0) return statusDiff;

                    // Third priority: Alphabetical by brand name
                    return a.brand_name.localeCompare(b.brand_name);
                });
                setSellers(sortedData);
                setFilteredSellers(sortedData);
            }
            setLoading(false);
        };
        fetchSellers();
    }, []);

    useEffect(() => {
        let results = sellers.filter(s =>
            s.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.ceo_name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (activeCategory !== "All") {
            results = results.filter(s => s.category === activeCategory);
        }

        setFilteredSellers(results);
    }, [searchTerm, activeCategory, sellers]);

    const handleContact = (whatsapp: string, brand: string, sellerId: string, profileUrl?: string) => {
        const cleanNumber = whatsapp.replace(/\D/g, '');
        const sellerProfileLink = `${window.location.origin}/seller/${sellerId}`;
        const message = `Hi ${brand}! I found you on the marketplace.\n\nYour Profile: ${sellerProfileLink}`;
        window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, "_blank");
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'elite':
                return (
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs font-black tracking-wider uppercase shadow-lg">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        Elite
                    </div>
                );
            case 'pro':
                return (
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black tracking-wider uppercase shadow-lg">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Pro
                    </div>
                );
            case 'premium':
                return (
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 text-xs font-black tracking-wider uppercase shadow-lg">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        Premium
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 pt-16 pb-12">
                <div className="text-center mb-12">
                    <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-4 leading-tight">
                        Discover Amazing
                        <br />
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Verified Sellers
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
                        Connect directly with trusted brands and business owners
                    </p>
                </div>

                {/* Search & Filter */}
                <div className="max-w-3xl mx-auto mb-16">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-3 flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input
                                type="text"
                                placeholder="Search brands, sellers, or categories..."
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-6 py-4 rounded-2xl bg-gray-50 border-0 font-bold text-gray-700 cursor-pointer hover:bg-gray-100 transition-all outline-none focus:ring-2 focus:ring-blue-500"
                            value={activeCategory}
                            onChange={(e) => setActiveCategory(e.target.value)}
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Sellers Grid */}
            <div className="max-w-7xl mx-auto px-4 pb-20">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-lg animate-pulse">
                                <div className="h-64 bg-gray-200"></div>
                                <div className="p-6 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    <div className="h-20 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredSellers.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No sellers found</h3>
                        <p className="text-gray-500">Try adjusting your search or select a different category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredSellers.map((seller) => (
                            <div key={seller.id} className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col">
                                {/* Profile Image */}
                                <div className="relative h-64 overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
                                    {seller.profile_pic_url ? (
                                        <img
                                            src={seller.profile_pic_url}
                                            alt={seller.brand_name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <div className={`${seller.profile_pic_url ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                                        <div className="text-7xl font-black text-blue-200 uppercase">
                                            {seller.brand_name.substring(0, 2)}
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4">
                                        {getStatusBadge(seller.status)}
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="p-6 flex-1 flex flex-col">
                                    {/* Category Tag - No Icon */}
                                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide w-fit mb-3">
                                        {seller.category}
                                    </div>

                                    {/* Brand & CEO */}
                                    <h2 className="text-2xl font-black text-gray-900 mb-1 leading-tight">
                                        {seller.brand_name}
                                    </h2>
                                    <p className="text-sm text-gray-500 font-semibold mb-2">
                                        CEO: {seller.ceo_name}
                                    </p>

                                    {/* Location - No Icon */}
                                    <p className="text-xs text-gray-500 mb-4">
                                        {seller.state}, {seller.country}
                                    </p>

                                    {/* Bio */}
                                    <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
                                        {seller.bio || 'A trusted seller on our marketplace.'}
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="space-y-3">
                                        <Link
                                            href={`/seller/${seller.id}/products`}
                                            className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold text-center hover:shadow-lg hover:scale-105 transition-all"
                                        >
                                            View Products
                                        </Link>
                                        <button
                                            onClick={() => handleContact(seller.whatsapp, seller.brand_name, seller.id, seller.profile_pic_url)}
                                            className="w-full bg-white border-2 border-gray-200 text-gray-800 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:border-gray-300"
                                        >
                                            <span className="font-black text-base">Contact Seller</span>
                                            <img src="/file.svg" alt="WhatsApp" className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-600 text-sm font-medium mb-6">
                        Connecting buyers with verified sellers across Nigeria
                    </p>
                    <div className="flex items-center justify-center gap-6 mb-6">
                        <Link href="/register-seller" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">Become a Seller</Link>
                        <span className="text-gray-300">•</span>
                        <button onClick={() => window.open(SHIPPING_URL, '_blank')} className="text-blue-600 hover:text-blue-700 font-semibold text-sm">Ship Products</button>
                        <span className="text-gray-300">•</span>
                        <Link href="/contact" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">Contact Admin</Link>
                    </div>
                    <p className="text-xs text-gray-400">
                        © 2026 Created by <span className="font-bold">Jandiebube Eboagoro Delight</span>
                    </p>
                </div>
            </footer>
        </div>
    );
}