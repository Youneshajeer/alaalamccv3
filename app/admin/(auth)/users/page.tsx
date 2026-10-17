import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import UsersManagerClient from './users';
import { hasPermission } from '@/lib/supabase/permissions';
import { getCurrentUserRole } from '@/lib/supabase/auth';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function AdminUsersPage() {
  const supabase = await getSupabaseServerClient();

  const authData = await getCurrentUserRole();
  
  if (!authData || !authData.user || !authData.isAuthorized) {
    redirect('/admin/login?error=unauthorized');
  }

  const { user, role, roleDisplayName } = authData;
  const userEmail = user.email || '';
  const userRoleName = role || 'supervisor';

  const canViewDashboard = await hasPermission('dashboard.view');
  const canManageUsers = await hasPermission('users.manage');
  const canViewUsers = await hasPermission('users.manage');
  const canViewActivityLogs = await hasPermission('activity_logs.view') || canManageUsers;
  // الشرط الموحد والآمن للسماح للمدراء والمشرفين بالدخول فوراً بناءً على جدول الأدوار فقط
  const isSuperAdminOrAdmin = userRoleName === 'super_admin' || userRoleName === 'admin' ;

  if (!isSuperAdminOrAdmin && (!canViewDashboard || !canManageUsers || !canViewUsers)) {
    console.error("Auth Failure Debug:", {
      userEmail,
      userRoleName,
      authDataAuthorized: authData?.isAuthorized,
      canViewDashboard,
      canManageUsers
    });

    return (
      <div className="p-8 bg-red-50 text-red-700 rounded-3xl m-8 border border-red-200" dir="rtl">
        <h2 className="text-xl font-black">🚫 تم رفض الدخول بواسطة شرط الحماية في page.tsx</h2>
        <p className="mt-2 text-sm">البريد الإلكتروني الحالي: <b>{userEmail}</b></p>
        <p className="mt-1 text-sm">الدور المستخرج (من جدول الأدوار): <b className="underline">{userRoleName}</b></p>
        <p className="mt-2 text-xs text-gray-500">حالة التصريح الكلية: {String(authData?.isAuthorized)}</p>
      </div>
    );
  }

  const { data: roles, error: rolesError } = await supabase.from('roles').select('*');
  if (rolesError) console.error('Roles Error:', rolesError.message);

  const { data: permissions, error: permError } = await supabase.from('permissions').select('*').order('module', { ascending: true });
  if (permError) console.error('Permissions Error:', permError.message);

  const { data: rolePermissions, error: rpError } = await supabase.from('role_permissions').select('*');
  if (rpError) console.error('Role Permissions Error:', rpError.message);

  const formattedRoles = (roles || []).map((role: any) => ({
    ...role,
    role_permissions: (rolePermissions || []).filter((rp: any) => rp.role_id === role.id),
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
    <div>
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
  );
}