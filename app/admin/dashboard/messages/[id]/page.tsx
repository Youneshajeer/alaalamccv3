import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import MessageDetailsClient from './messageDetailsClient';
import { hasPermission } from '@/lib/supabase/permissions';
import { getMessageDetailsAction } from '../actions'; 

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MessageDetailsPage({ params }: PageProps) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const allowed = await hasPermission('messages.view');
  if (!allowed) {
    redirect('/admin/dashboard?error=unauthorized');
  }

  const resolvedParams = await params;
  const messageId = resolvedParams.id;

  const result = await getMessageDetailsAction(messageId);

  if (!result.success || !result.message) {
    notFound();
  }

  const message = result.message;

  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value as 'ar' | 'en') || 'ar';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 sm:p-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <MessageDetailsClient message={message} lang={lang} />
    </div>
  );
}