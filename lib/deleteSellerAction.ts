// lib/deleteSellerAction.ts
'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function deleteSellerProfile(sellerId: string) {
    try {
        // Optional: get name for better message
        const { data: seller, error: fetchError } = await supabase
            .from('sellers')
            .select('brand_name')
            .eq('id', sellerId)
            .single();

        if (fetchError || !seller) {
            return { success: false, error: 'Seller not found' };
        }

        const { error } = await supabase
            .from('sellers')
            .delete()
            .eq('id', sellerId);

        if (error) {
            console.error('Delete error:', error);
            return { success: false, error: error.message || 'Failed to delete' };
        }

        return {
            success: true,
            message: `Seller "${seller.brand_name}" profile deleted permanently`
        };
    } catch (err: any) {
        console.error('Delete action failed:', err);
        return { success: false, error: err.message || 'Server error' };
    }
}