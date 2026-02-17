import Image from "next/image";
import Link from "next/link";

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Hero Section */}
            <section className="relative py-20 px-4 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                        Discover Amazing Sellers
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Connect directly with top brands and sellers in Nigeria. Browse products, book via WhatsApp, and experience seamless marketplace shopping.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/sellers" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg transition-shadow">
                            Browse Sellers
                        </Link>
                        <Link href="/register" className="w-full sm:w-auto border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                            Join as Seller
                        </Link>
                        <Link href="/admin" className="w-full sm:w-auto text-gray-400 hover:text-blue-600 px-4 py-2 rounded-lg font-medium text-sm transition-colors">

                        </Link>
                    </div>
                </div>
                <div className="absolute top-10 left-10 opacity-20">
                    <Image src="/next.svg" alt="Icon" width={50} height={50} />
                </div>
                <div className="absolute bottom-10 right-10 opacity-20">
                    <Image src="/globe.svg" alt="Icon" width={50} height={50} />
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Why Choose Our Marketplace?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md">
                            <Image src="/file.svg" alt="Direct Contact" width={60} height={60} className="mx-auto mb-4" />
                            <h3 className="text-2xl font-semibold text-green-700 mb-2">Direct WhatsApp Booking</h3>
                            <p className="text-gray-600">Connect instantly with sellers for personalized service.</p>
                        </div>
                        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md">
                            <Image src="/window.svg" alt="Verified Sellers" width={60} height={60} className="mx-auto mb-4" />
                            <h3 className="text-2xl font-semibold text-blue-700 mb-2">Verified Sellers</h3>
                            <p className="text-gray-600">Premium and elite brands with trusted quality.</p>
                        </div>
                        <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md">
                            <Image src="/vercel.svg" alt="Fast Shipping" width={60} height={60} className="mx-auto mb-4" />
                            <h3 className="text-2xl font-semibold text-purple-700 mb-2">Fast Shipping</h3>
                            <p className="text-gray-600">Reliable delivery options for all orders.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-4xl font-bold mb-6">Ready to Start Selling?</h2>
                    <p className="text-xl mb-8">Join thousands of sellers and grow your business today.</p>
                    <Link href="/register" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                        Register Now
                    </Link>
                </div>
            </section>
        </div>
    );
}