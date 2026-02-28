// lib/selfProfileDeleteAction.ts
'use server';

import { createClient } from '@supabase/supabase-js';

export async function deleteMyAuthAccount() {
    // 1. Get current authenticated user (client uses session cookies)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error('[deleteMyAuthAccount] User fetch failed:', userError);
        return { success: false, error: 'Not authenticated or session expired' };
    }

    console.log('[deleteMyAuthAccount] Deleting auth user:', user.id);

    // 2. Admin client with service_role key (secret)
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

    // 3. Actually delete the user from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
        console.error('[deleteMyAuthAccount] deleteUser failed:', deleteError);
        return { success: false, error: deleteError.message || 'Failed to delete auth account' };
    }

    console.log('[deleteMyAuthAccount] Auth user successfully deleted');

    return {
        success: true,
        message: 'Your account has been permanently deleted'
    };
}