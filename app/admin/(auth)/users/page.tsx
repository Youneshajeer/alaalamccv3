import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import UsersManagerClient from './users';
import { hasPermission } from '@/lib/supabase/permissions';

export const revalidate = 0;

export default async function AdminUsersPage() {
  const supabase = await getSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log("🔍 [DEBUG 1] Auth User Response:", { userId: user?.id, email: user?.email, authError });
  if (!user) {
    return (
      <div className="p-8 text-center text-red-600 font-bold bg-red-50 min-h-screen flex items-center justify-center" dir="rtl">
        ❌ خطأ تشخيصي: لا يوجد مستخدم مسجل دخول (User is null). يرجى تسجيل الدخول من جديد.
      </div>
    );
  }

  // 2. فحص جدول profiles الأساسي
  const { data: currentProfile, error: profileError } = await supabase
    .from('profiles')
    .select('email, role, full_name')
    .eq('id', user.id)
    .single();
  
  console.log("🔍 [DEBUG 2] Profiles Table Record:", { currentProfile, profileError });

  const { data: userRoleRecord, error: roleJoinError } = await supabase
    .from('user_roles')
    .select(`
      role_id,
      roles (
        name,
        display_name
      )
    `)
    .eq('user_id', user.id)
    .maybeSingle();

  console.log("🔍 [DEBUG 3] User Roles Join Record:", { userRoleRecord, roleJoinError });

  const dbRoleName = (userRoleRecord?.roles as any)?.name;
  const profileRole = currentProfile?.role;
const canViewActivityLogs = await hasPermission('activity_logs.view') || await hasPermission('users.manage');
  const userRoleName = dbRoleName || profileRole || 'supervisor';
  console.log("🔍 [DEBUG 4] Final Determined userRoleName is:", userRoleName);

  const allowedRoles = ['admin', 'supervisor'];
  if (!allowedRoles.includes(userRoleName)) {
    return (
      <div className="p-8 bg-red-50 text-red-700 rounded-3xl m-8 border border-red-200" dir="rtl">
        <h2 className="text-xl font-black">🚫 تم رفض الدخول بواسطة شرط الحماية في page.tsx</h2>
        <p className="mt-2 text-sm">البريد الإلكتروني الحالي: <b>{user.email}</b></p>
        <p className="mt-1 text-sm">الدور المستخرج (userRoleName): <b className="underline">{userRoleName}</b></p>
        <p className="mt-1 text-sm">دور جدول الـ Profile: <b>{profileRole}</b></p>
        <p className="mt-1 text-sm">دور جدول الـ user_roles: <b>{dbRoleName || 'غير موجود'}</b></p>
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

  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (profilesError) console.error('Profiles Error:', profilesError.message);

  const { data: userRoles, error: urError } = await supabase.from('user_roles').select('*');
  if (urError) console.error('User Roles Error:', urError.message);

  const formattedUsers = (profiles || []).map((profile: any) => {
    const matchedUR = (userRoles || []).find((ur: any) => ur.user_id === profile.id);
    const matchedRole = (roles || []).find((r: any) => r.id === matchedUR?.role_id);
    
    return {
      ...profile,
      user_roles: matchedRole ? [{ roles: matchedRole }] : [],
    };
  });

  return (
    <div>
      

      <UsersManagerClient
        roles={formattedRoles}
        permissions={permissions || []}
        initialUsers={formattedUsers}
        currentUserId={user.id}
        currentUserEmail={currentProfile?.email || user.email || ''}
        currentUserRole={userRoleName}
        canViewActivityLogs={canViewActivityLogs}
        
      />
    </div>
  );
}