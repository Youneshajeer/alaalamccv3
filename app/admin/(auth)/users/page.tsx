import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import UsersManagerClient from './users';
import { hasPermission } from '@/lib/supabase/permissions';
import { getCurrentUserRole } from '@/lib/supabase/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { logoutAction } from './actions';

export const revalidate = 0;

export default async function AdminUsersPage() {
  const supabase = await getSupabaseServerClient();

  const authData = await getCurrentUserRole();
  
  if (!authData || !authData.user || !authData.isAuthorized) {
    redirect('/admin/login?error=unauthorized');
  }

  const { user, role, roleDisplayName } = authData;
  const userEmail = user?.email || '';
  const userRoleName = role || 'user';

  const canManageUsers = await hasPermission('users.manage');
  const canViewActivityLogs = await hasPermission('activity_logs.view') || canManageUsers;

  if (!canManageUsers) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center" dir="rtl">
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-3xl p-8 max-w-lg w-full space-y-6 shadow-lg text-center">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/60 rounded-full flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400 text-xl font-bold">
            🚫
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-black">تم رفض الوصول للحساب</h2>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80 leading-relaxed">
              حسابك الحالي لا يمتلك الصلاحيات المطلوبةلاستعراض أو إدارة صفحة المستخدمين والمشرفين.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-rose-200/50 dark:border-rose-800/50 text-right space-y-1.5 text-xs font-mono">
            <p>البريد الإلكتروني: <b className="text-slate-900 dark:text-white">{userEmail || 'غير مسجل'}</b></p>
            <p>الدور المعين: <b className="text-emerald-600 underline">{roleDisplayName || userRoleName}</b></p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href={userEmail ? '/admin/dashboard' : '/admin/login'}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-all shadow-sm"
            >
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>{userEmail ? 'العودة للوحة التحكم' : 'الذهاب لصفحة الدخول'}</span>
            </Link>

            {userEmail && (
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-900/40 hover:bg-rose-200/60 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>تسجيل الخروج</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { data: roles, error: rolesError } = await supabase.from('roles').select('*');
  if (rolesError) console.error('Roles Error:', rolesError.message);

  const { data: permissions, error: permError } = await supabase
    .from('permissions')
    .select('*')
    .order('module', { ascending: true });
  if (permError) console.error('Permissions Error:', permError.message);

  const { data: rolePermissions, error: rpError } = await supabase.from('role_permissions').select('*');
  if (rpError) console.error('Role Permissions Error:', rpError.message);

  const formattedRoles = (roles || []).map((r: any) => ({
    ...r,
    role_permissions: (rolePermissions || []).filter((rp: any) => rp.role_id === r.id),
  }));

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select(`
      *,
      user_roles (
        role_id,
        roles (
          id,
          name,
          display_name
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (profilesError) console.error('Profiles Error:', profilesError.message);

  const formattedUsers = (profiles || []).map((profile: any) => {
    const assignedRole = profile.user_roles?.[0]?.roles || null;

    return {
      ...profile,
      user_roles: assignedRole ? [{ roles: assignedRole }] : [],
    };
  });

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <UsersManagerClient
          roles={formattedRoles}
          permissions={permissions || []}
          initialUsers={formattedUsers}
          currentUserId={user.id}
          currentUserEmail={userEmail}
          currentUserRole={userRoleName}
          roleDisplayName={roleDisplayName}
          canViewActivityLogs={canViewActivityLogs}
        />
      </div>
    </div>
  );
}