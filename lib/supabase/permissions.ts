import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';


export async function hasPermission(permissionName: string): Promise<boolean> {
  const supabase = await getSupabaseServerClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active) return false;
  
  if (profile.role === 'admin') return true;

  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      roles (
        role_permissions (
          permissions (
            name
          )
        )
      )
    `)
    .eq('user_id', user.id);

  if (error || !data) return false;

  const permissions: string[] = [];
  data.forEach((ur: any) => {
    ur.roles?.role_permissions?.forEach((rp: any) => {
      if (rp.permissions?.name) {
        permissions.push(rp.permissions.name);
      }
    });
  });

  return permissions.includes(permissionName);
}


export async function getCurrentUserPermissions() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { role: null, permissions: [] };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email, full_name')
    .eq('id', user.id)
    .single();

  return {
    user,
    profile,
  };
}