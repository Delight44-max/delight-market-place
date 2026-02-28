// lib/supabase.ts  (add at the bottom)
'use server';

import { createClient } from '@supabase/supabase-js';

export async function permanentlyDeleteAuthUser(userId: string) {
    'use server';

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // ← the powerful key
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
        console.error('Auth delete failed:', error);
        return { success: false, error: error.message || 'Failed to delete user from auth' };
    }

    return { success: true, message: 'User permanently deleted from authentication' };
}