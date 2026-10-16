import { getSupabaseServerClient } from './supabase-server';

export async function getCurrentUserRole() {
  const supabase = await getSupabaseServerClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { user: null, role: null, roleDisplayName: null, isAuthorized: false };
  }

  const { data: userRoleRecord } = await supabase
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

  const roleData = (userRoleRecord?.roles as any);
  const userRole = roleData?.name || null; 
  const roleDisplayName = roleData?.display_name || userRole;
  const roleId = userRoleRecord?.role_id;

  if (userRole === 'super_admin' || userRole === 'admin') {
    return { 
      user, 
      role: userRole, 
      roleDisplayName, 
      isAuthorized: true
    };
  }

  if (!roleId) {
    return { user, role: userRole, roleDisplayName, isAuthorized: false };
  }

  const { count, error: permError } = await supabase
    .from('role_permissions')
    .select('*', { count: 'exact', head: true })
    .eq('role_id', roleId);

  const isAuthorized = !permError && (count !== null && count > 0);

  return { 
    user, 
    role: userRole, 
    roleDisplayName, 
    isAuthorized 
  };
}