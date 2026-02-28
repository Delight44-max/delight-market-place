'use server';

import { createClient } from '@supabase/supabase-js';

export async function deleteMyAuthAccount() {

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return { success: false, error: 'Not authenticated or session expired' };
    }


    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (error) {
        console.error('Auth delete failed:', error);
        return { success: false, error: error.message || 'Failed to delete authentication account' };
    }

    return { success: true, message: 'Your auth account has been permanently deleted' };
}