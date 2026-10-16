import { hasPermission } from '@/lib/supabase/permissions';
import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import MessageClient from './messageClient';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function MessagesPage({ searchParams }: PageProps) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const userEmail = user.email || '';

  // 🔒 جلب الدور حصرياً من النظام الحديث user_roles فقط
  const { data: userRoleRecord } = await supabase
    .from('user_roles')
    .select(`
      roles (
        name
      )
    `)
    .eq('user_id', user.id)
    .maybeSingle();

  const dbRoleName = (userRoleRecord?.roles as any)?.name;
  
  // ✅ الاعتماد حصرياً على الدور الحديث وإلغاء الاستعلام القديم من profiles تماماً
  const userRole = dbRoleName || 'supervisor';

  const allowed = await hasPermission('messages.view');

  if (!allowed) {
    redirect('/admin/dashboard?error=unauthorized');
  }

  const allowdView = await hasPermission('messages.view');
  const allowdManage = await hasPermission('messages.manage');
  const allowdDelete = await hasPermission('messages.delete');
  
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value as 'ar' | 'en') || 'ar';

  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const limit = 10;
  const search = resolvedParams.search || '';
  const status = resolvedParams.status || 'all';

  const offset = (page - 1) * limit;

  let query = supabase
    .from('customer_service')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%,message.ilike.%${search}%`);
  }

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error('فشل في جلب رسائل العملاء');
  }

  const messages = data || [];
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 sm:p-10">
      <MessageClient
        initialMessages={messages}
        totalCount={totalCount}
        totalPages={totalPages}
        currentPage={page}
        currentSearch={search}
        currentStatus={status}
        lang={lang}
        userEmail={userEmail}      
        userRole={userRole} 
        permission={{
          allowdView,
          allowdManage,
          allowdDelete,
        }}       
      />
    </div>
  );
}