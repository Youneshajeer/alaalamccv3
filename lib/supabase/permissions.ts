import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';

export async function hasPermission(permissionName: string): Promise<boolean> {
  const supabase = await getSupabaseServerClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_active')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active) return false;

  // 1. جلب الدور الخاص بالمستخدم من user_roles وجدول roles
  const { data: userRolesData, error: rolesError } = await supabase
    .from('user_roles')
    .select(`
      roles (
        name,
        role_permissions (
          permissions (
            name
          )
        )
      )
    `)
    .eq('user_id', user.id);

  if (rolesError || !userRolesData) return false;

  const roles: string[] = [];
  const permissions: string[] = [];

  userRolesData.forEach((ur: any) => {
    if (ur.roles?.name) {
      roles.push(ur.roles.name);
    }
    ur.roles?.role_permissions?.forEach((rp: any) => {
      if (rp.permissions?.name) {
        permissions.push(rp.permissions.name);
      }
    });
  });

  // 🔴 2. صمام الأمان (Bypass) للسوبر أدمن والأدمن:
  // إذا كان دور المستخدم 'super_admin' أو 'admin'، يتم السماح له فوراً ودون فحص جدول الصلاحيات
  if (roles.includes('super_admin') ) {
    return true;
  }

  // 3. لباقي المستخدمين العاديين: التحقق من وجود الصلاحية المحددة في مصفوفة صلاحياتهم
  return permissions.includes(permissionName);
}

export async function getCurrentUserPermissions() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { user: null, profile: null, permissions: [] };

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name, is_active')
    .eq('id', user.id)
    .single();

  return {
    user,
    profile,
  };
}