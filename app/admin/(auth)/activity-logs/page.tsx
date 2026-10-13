import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import { redirect } from 'next/navigation';
import { getActivityLogs } from './actions';
import ActivityLogsClient from './ActivityLogsClient';
import { hasPermission } from '@/lib/supabase/permissions';

export default async function ActivityLogsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const supabase = await getSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect('/admin/login');
    }

    const canView = await hasPermission('activity_logs.view') || await hasPermission('users.manage');
    if (!canView) {
        redirect('/admin/dashboard');
    }

    const resolvedParams = await searchParams;
    const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;
    const emailQuery = typeof resolvedParams.email === 'string' ? resolvedParams.email : '';
    const actionType = typeof resolvedParams.actionType === 'string' ? resolvedParams.actionType : 'ALL';
    const targetTable = typeof resolvedParams.targetTable === 'string' ? resolvedParams.targetTable : 'ALL';
    const startDate = typeof resolvedParams.startDate === 'string' ? resolvedParams.startDate : '';
    const endDate = typeof resolvedParams.endDate === 'string' ? resolvedParams.endDate : '';

    const result = await getActivityLogs({
        page,
        limit: 15,
        emailQuery,
        actionType,
        targetTable,
        startDate,
        endDate,
    });

    const userEmail = user.email || '';

    const { data: userRoleRecord } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)
        .maybeSingle();

    const userRole = (userRoleRecord?.roles as any)?.name || 'admin';

    return (
        <ActivityLogsClient
            initialLogs={result.logs}
            totalCount={result.totalCount}
            currentPage={result.currentPage || page}
            totalPages={result.totalPages || 1}
            userEmail={userEmail}
            userRole={userRole}
        />
    );
}