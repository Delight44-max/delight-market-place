"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import { uploadToCloudinary } from "../../lib/cloudinary";

export default function RegisterSeller() {
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        ceoName: "",
        brandName: "",
        category: "Fashion",
        whatsapp: "",
        country: "",
        state: "",
        bio: "",
        profilePic: null as File | null,
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, profilePic: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {

            let profilePicUrl = null;
            if (formData.profilePic) {
                profilePicUrl = await uploadToCloudinary(formData.profilePic, 'profiles');
            }


            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/login`,
                    data: {
                        ceo_name: formData.ceoName,
                        brand_name: formData.brandName,
                        category: formData.category,
                        whatsapp: formData.whatsapp,
                        country: formData.country,
                        state: formData.state,
                        bio: formData.bio,
                        profile_pic_url: profilePicUrl
                    }
                }
            });

            if (authError) throw authError;


            setIsSubmitted(true);
            toast.success("Registration successful!");
        } catch (error: any) {
            toast.error(error.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center py-10 px-4">
            <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 border border-gray-200 hover:shadow-2xl transition-shadow duration-300">

                {isSubmitted ? (
                    /* SUCCESS VIEW: Shown after successful registration */
                    <div className="text-center py-10 animate-in fade-in zoom-in duration-300">
                        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">Verify Email</h1>
                        <p className="text-gray-600 mb-8">
                            We&apos;ve sent a verification link to <br />
                            <span className="font-bold text-blue-600">{formData.email}</span>. <br /><br />
                            Please click the link in the email to activate your account and log in.
                        </p>
                        <Link
                            href="/login"
                            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md"
                        >
                            Go to Login
                        </Link>
                    </div>
                ) : (
                    /* FORM VIEW: Initial registration form */
                    <>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Seller Registration</h1>
                        <p className="text-gray-500 mb-8 text-sm text-center">Join our marketplace and start selling.</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    value={formData.email}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-lg p-3 pr-10 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        value={formData.password}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">CEO / Owner Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    onChange={(e) => setFormData({...formData, ceoName: e.target.value})}
                                    value={formData.ceoName}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Brand / Company Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    onChange={(e) => setFormData({...formData, brandName: e.target.value})}
                                    value={formData.brandName}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Business Category</label>
                                <select
                                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    value={formData.category}
                                >
                                    <option>Fashion</option>
                                    <option>Electronics</option>
                                    <option>Food / Groceries</option>
                                    <option>Services</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Number</label>
                                <input
                                    type="tel"
                                    placeholder="e.g. +2348012345678"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                                    value={formData.whatsapp}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                                    value={formData.country}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">State / Region</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                                    value={formData.state}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Short Bio</label>
                                <textarea
                                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    rows={3}
                                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                    value={formData.bio}
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Profile Picture</label>
                                <input
                                    id="profilePic"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                                <label
                                    htmlFor="profilePic"
                                    className="mt-1 block w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-all duration-200"
                                >
                                    <span className="text-gray-600">Click to upload profile picture</span>
                                </label>
                                {preview && (
                                    <div className="mt-4 flex justify-center">
                                        <img
                                            src={preview}
                                            alt="Profile Preview"
                                            className="w-24 h-24 object-cover rounded-full border-4 border-blue-100 shadow-lg"
                                        />
                                    </div>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                            >
                                {loading ? "Registering..." : "Register My Brand"}
                            </button>
                        </form>
                        <div className="mt-8 text-center">
                            <p className="text-gray-600">Already have an account? <Link href="/login" className="text-blue-600 hover:text-purple-600 font-semibold transition-colors">Login here</Link></p>
                        </div>
                    </>
                )}
            </div>
            <footer className="mt-10 text-gray-400 text-xs text-center">
                © 2026 by Jandiebube Eboagoro Delight
            </footer>
        </div>
    );
}