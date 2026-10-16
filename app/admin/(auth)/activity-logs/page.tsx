import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import { redirect } from 'next/navigation';
import { getActivityLogs } from './actions';
import ActivityLogsClient from './ActivityLogsClient';
import { hasPermission } from '@/lib/supabase/permissions';
import { getCurrentUserRole } from '@/lib/supabase/auth';
export const revalidate = 0;

export default async function ActivityLogsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const supabase = await getSupabaseServerClient();

    const authData = await getCurrentUserRole();
    
    if (!authData || !authData.user || !authData.isAuthorized) {
        redirect('/admin/login?error=unauthorized');
    }

    const { user, role, roleDisplayName } = authData;
    const userEmail = user.email || '';
    const userRole = role || 'supervisor';

    const canViewDashboard = await hasPermission('dashboard.view');
    const canViewActivityLogs = await hasPermission('activity_logs.view') || await hasPermission('users.manage');

    if (!canViewDashboard || !canViewActivityLogs) {
        redirect('/admin/dashboard?error=unauthorized');
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

    return (
        <ActivityLogsClient
            initialLogs={result.logs}
            totalCount={result.totalCount}
            currentPage={result.currentPage || page}
            totalPages={result.totalPages || 1}
            userEmail={userEmail}
            userRole={userRole}
            roleDisplayName={roleDisplayName}
        />
    );
}