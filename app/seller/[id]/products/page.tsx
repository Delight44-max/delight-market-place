"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../../lib/supabase";

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
    brand_name: string;
    ceo_name: string;
    whatsapp: string;
    bio: string;
    status: string;
    category: string;
    country: string;
    state: string;
    profile_pic_url?: string;
}

export default function SellerProducts() {
    const params = useParams();
    const router = useRouter();
    const sellerId = params.id as string;

    const [seller, setSeller] = useState<Seller | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (sellerId) {
            fetchSellerAndProducts();
        }
    }, [sellerId]);

    const fetchSellerAndProducts = async () => {
        setLoading(true);

        // Fetch seller info
        const { data: sellerData } = await supabase
            .from("sellers")
            .select("*")
            .eq("id", sellerId)
            .single();

        if (sellerData) {
            setSeller(sellerData);
        }

        // Fetch products
        const { data: productsData } = await supabase
            .from("products")
            .select("*")
            .eq("seller_id", sellerId)
            .order('created_at', { ascending: false });

        if (productsData) {
            setProducts(productsData);
        }

        setLoading(false);
    };

    const handleContactForProduct = (product: Product) => {
        if (!seller) return;
        const cleanNumber = seller.whatsapp.replace(/\D/g, '');
        const productImage = product.image_url;
        const message = `Hi ${seller.brand_name}! I'm interested in buying this product:\n\n${product.description}\n\nPrice: ${product.currency} ${product.price.toLocaleString()}\n\nProduct Image: ${productImage}`;
        window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, "_blank");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                    <p className="text-gray-600 font-semibold">Loading products...</p>
                </div>
            </div>
        );
    }

    if (!seller) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Seller not found</h2>
                    <Link href="/sellers" className="text-blue-600 hover:text-blue-700 font-semibold">
                        ← Back to Sellers
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Simple Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/sellers" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back
                    </Link>
                    <h1 className="text-xl font-black text-gray-900">{seller.brand_name}</h1>
                    <div className="w-20"></div> {/* Spacer for centering */}
                </div>
            </div>

            {/* Products Grid - E-commerce Style */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {products.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-200">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No Products Yet</h3>
                        <p className="text-gray-500 text-sm">This seller hasn't added any products.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <div key={product.id} className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-blue-400 hover:shadow-2xl transition-all duration-300 flex flex-col">
                                {/* Product Image */}
                                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                                    <img
                                        src={product.image_url}
                                        alt={product.description}
                                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                    />
                                    {product.video_url && (
                                        <div className="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                                            Video
                                        </div>
                                    )}
                                </div>

                                {/* Product Details */}
                                <div className="p-4 flex flex-col flex-1">
                                    {/* Description */}
                                    <p className="text-sm font-semibold text-gray-900 mb-3 line-clamp-2 min-h-[40px] leading-relaxed">
                                        {product.description}
                                    </p>

                                    {/* Price */}
                                    <div className="mb-4">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Price</p>
                                        <span className="text-xl font-semibold text-gray-400">
                                            {product.currency} {product.price.toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Contact Button */}
                                    <button
                                        onClick={() => handleContactForProduct(product)}
                                        className="mt-auto w-full bg-white border-2 border-gray-200 text-gray-800 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:border-gray-300"
                                    >
                                        <span className="font-black text-sm">Contact Seller</span>
                                        <img src="/file.svg" alt="WhatsApp" className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-8 mt-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-xs text-gray-400">
                        © 2026 Created by <span className="font-bold">Jandiebube Eboagoro Delight</span>
                    </p>
                </div>
            </footer>
        </div>
    );
}