import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import { hasPermission } from '@/lib/supabase/permissions';

export default async function AdminDashboardPage() {
  const supabase = await getSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }
  
  const userEmail = user.email || '';

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

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const userRole = dbRoleName || currentProfile?.role || 'supervisor';
  const canViewMessages = await hasPermission('messages.view');     
  const canViewRequests = await hasPermission('requests.view');     
  const canViewJobs = await hasPermission('jobs.view');             
  const canViewUsers = await hasPermission('users.manage');         

  const { data: messagesData, count: totalMessages } = await supabase
    .from('customer_service')
    .select('*', { count: 'exact' });

  const messagesList = messagesData || [];
  const unreadMessages = messagesList.filter((m: any) => m.status === 'unread').length;
  const readMessages = messagesList.filter((m: any) => m.status === 'read').length;

  const { data: requestsData, count: totalRequests } = await supabase
    .from('request-service')
    .select('*', { count: 'exact' });

  const requestsList = requestsData || [];
  const unreadRequests = requestsList.filter((r: any) => r.status === 'unread').length;
  const readRequests = requestsList.filter((r: any) => r.status === 'read').length;
  const actionTakenRequests = requestsList.filter((r: any) => r.action_taken === true).length;
  const pendingRequests = requestsList.filter((r: any) => r.action_taken === false || !r.action_taken).length;

  // استعلام الوظائف وتصنيفها بشكل مرن
  const { data: jobsData, count: totalJobs } = await supabase
    .from('jobs')
    .select('*', { count: 'exact' });

  const jobsList = jobsData || [];
  // فحص مرن للحالة (يقبل الحروف الكبيرة والصغيرة أو القيم المنطقية)
  const activeJobs = jobsList.filter((j: any) => 
    j.status === 'active' || j.status === 'Active' || j.is_active === true
  ).length;
  
  const inactiveJobs = (totalJobs || jobsList.length) - activeJobs;

  // استعلام المتقدمين وتصنيفهم بشكل مرن
  const { data: careersData, count: totalCareers } = await supabase
    .from('careers')
    .select('*', { count: 'exact' });

  const careersList = careersData || [];
  const advertisedApplicants = careersList.filter((c: any) => 
    c.job_id !== null && c.job_id !== '' && c.job_id !== undefined
  ).length;
  
  const directApplicants = (totalCareers || careersList.length) - advertisedApplicants;

  const { data: rolesData } = await supabase.from('roles').select('id, name, display_name');
  const allRoles = rolesData || [];

  const { data: profilesWithRolesData } = await supabase
    .from('profiles')
    .select(`
      id,
      is_active,
      user_roles (
        roles (
          id,
          name,
          display_name
        )
      )
    `);

  const profiles = profilesWithRolesData || [];

  let totalAdmins = 0;
  let activeAdmins = 0;
  let totalSupervisors = 0;
  let activeSupervisors = 0;

  const roleStatsMap: Record<string, { name: string; displayName: string; total: number; active: number }> = {};
  
  allRoles.forEach((r: any) => {
    roleStatsMap[r.name] = {
      name: r.name,
      displayName: r.display_name || r.name,
      total: 0,
      active: 0,
    };
  });

  profiles.forEach((p: any) => {
    const roleNames = p.user_roles?.map((ur: any) => ur.roles?.name) || [];
    const isAdmin = roleNames.includes('admin') || roleNames.includes('super_admin');
    const isSupervisor = roleNames.includes('supervisor');

    if (isAdmin) {
      totalAdmins++;
      if (p.is_active) activeAdmins++;
    }
    if (isSupervisor) {
      totalSupervisors++;
      if (p.is_active) activeSupervisors++;
    }

    const assignedRoles = p.user_roles?.map((ur: any) => ur.roles) || [];
    assignedRoles.forEach((roleObj: any) => {
      if (roleObj && roleStatsMap[roleObj.name]) {
        roleStatsMap[roleObj.name].total++;
        if (p.is_active) {
          roleStatsMap[roleObj.name].active++;
        }
      }
    });
  });

  const recentRequests = requestsList.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 sm:p-10">
      <DashboardClient
        stats={{
          messages: {
            total: totalMessages || messagesList.length,
            unread: unreadMessages,
            read: readMessages,
          },
          requests: {
            total: totalRequests || requestsList.length,
            read: readRequests,
            unread: unreadRequests,
            actionTaken: actionTakenRequests,
            pending: pendingRequests,
          },
          jobs: {
            total: totalJobs || jobsList.length,
            active: activeJobs,
            inactive: inactiveJobs,
            applicants: totalCareers || careersList.length,
            advertised: advertisedApplicants,
            direct: directApplicants,
          },
          users: {
            totalAdmins,
            activeAdmins,
            totalSupervisors,
            activeSupervisors,
            total: profiles.length,
          },
          rolesBreakdown: Object.values(roleStatsMap),
        }}
        recentRequests={recentRequests}
        userEmail={userEmail}
        userRole={userRole}
        permissions={{
          canViewMessages,
          canViewRequests,
          canViewJobs,
          canViewUsers,
        }}
      />
    </div>
  );
}