'use client';

import { useState, useTransition } from 'react';
import AdminHeader from '@/components/admin/AdminHeader'; 
import Link from 'next/link';
import { 
  createUserAction, 
  updateUserRoleAction, 
  toggleUserStatusAction, 
  deleteUserAction,
  createNewPermissionAction, 
  updateRolePermissionsAction, 
  unblockUserAction,
  generateSecureResetTokenAction
} from './actions';

interface Role {
  id: string;
  name: string;
  display_name: string;
  role_permissions?: Array<{ permission_id: string }>;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  is_blocked?: boolean;
  created_at: string;
  user_roles?: Array<{
    roles: Role;
  }>;
}

interface UsersManagerProps {
  roles: Role[];
  permissions: Permission[];
  initialUsers: UserProfile[];
  currentUserId: string;
  currentUserEmail?: string;
  currentUserRole?: string;
  canViewActivityLogs?: boolean,
}

export default function UsersManagerClient({
  roles = [],
  permissions = [],
  initialUsers = [],
  currentUserId,
  currentUserEmail = '',
  currentUserRole = 'supervisor',
  canViewActivityLogs,
}: UsersManagerProps) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAddRoleId, setSelectedAddRoleId] = useState(roles[0]?.id || '');

  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || '');
  const currentRole = roles.find((r) => r.id === selectedRoleId) || roles[0];
  
  const [assignedPermissions, setAssignedPermissions] = useState<string[]>(
    currentRole?.role_permissions?.map((rp) => rp.permission_id) || []
  );

  const [newPermName, setNewPermName] = useState('');
  const [newPermModule, setNewPermModule] = useState('jobs');
  const [newPermDesc, setNewPermDesc] = useState('');

  const handleRoleSelectChange = (roleId: string) => {
    setSelectedRoleId(roleId);
    const found = roles.find((r) => r.id === roleId);
    setAssignedPermissions(found?.role_permissions?.map((rp) => rp.permission_id) || []);
  };

  const handleCheckboxToggle = (permId: string) => {
    setAssignedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSavePermissions = () => {
    if (!selectedRoleId) return;
    startTransition(async () => {
      const res = await updateRolePermissionsAction(selectedRoleId, assignedPermissions);
      if (res.success) {
        setMessage({ text: 'تم تحديث صلاحيات الدور بنجاح!', type: 'success' });
      } else {
        setMessage({ text: res.error || 'حدث خطأ أثناء التحديث.', type: 'error' });
      }
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createUserAction({
        fullName,
        email,
        password,
        roleId: selectedAddRoleId || roles[0]?.id,
      });

      if (res.success) {
        setMessage({ text: 'تم إضافة المشرف بنجاح.', type: 'success' });
        setShowAddUserModal(false);
        setFullName('');
        setEmail('');
        setPassword('');
        window.location.reload();
      } else {
        setMessage({ text: res.error || 'فشل إضافة المشرف.', type: 'error' });
      }
    });
  };

  const handleUserRoleChange = (userId: string, newRoleId: string) => {
    startTransition(async () => {
      const res = await updateUserRoleAction(userId, newRoleId);
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.error);
      }
    });
  };

  const handleAddPermission = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createNewPermissionAction({
        name: newPermName,
        module: newPermModule,
        description: newPermDesc,
      });

      if (res.success) {
        setMessage({ text: 'تمت إضافة الصلاحية بنجاح!', type: 'success' });
        setNewPermName('');
        setNewPermDesc('');
        window.location.reload();
      } else {
        setMessage({ text: res.error || 'فشل إضافة الصلاحية.', type: 'error' });
      }
    });
  };

  const permissionsByModule = permissions.reduce((acc: Record<string, Permission[]>, perm) => {
    const mod = perm.module || 'general';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});

  const moduleNamesArabic: Record<string, string> = {
    jobs: 'إدارة الوظائف الشاغرة (Jobs)',
    careers: 'طلبات التوظيف والسير الذاتية (Careers)',
    customer_service: 'رسائل خدمة العملاء (Customer Service)',
    requests: 'طلبات الخدمات المقدمة (Request-Service)',
    messages: 'الرسائل (Messages)',
    users: 'إدارة المشرفين والصلاحيات (Users)',
    general: 'عام / أقسام أخرى',
  };

  return (
    <div className="space-y-6 sm:space-y-10 p-3 sm:p-6 bg-slate-50 dark:bg-slate-950 min-h-screen rounded-3xl" dir="rtl">
      <AdminHeader
        titleAr="إدارة المشرفين والصلاحيات"
        titleEn="Manage Users & Permissions"
        lang="ar"
        userEmail={currentUserEmail}
        userRole={currentUserRole === 'supervisor' ? 'supervisor' : 'admin'}
      />
      {message && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">قائمة المشرفين المسجلين</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">عرض وتعديل الأدوار الوظيفية وإدارة حالات الحسابات.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {canViewActivityLogs && (
              <Link
                href="/admin/activity-logs"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-2xl text-xs shadow-sm transition-all cursor-pointer text-center"
              >
                🛡️ سجل النشاطات والأمان
              </Link>
            )}

            <button
              onClick={() => setShowAddUserModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-2xl text-xs shadow-sm transition-all cursor-pointer text-center"
            >
              + إضافة مشرف جديد
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-150">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-500 font-bold whitespace-nowrap">
                  <th className="p-4">البريد الإلكتروني</th>
                  <th className="p-4">الاسم الكامل</th>
                  <th className="p-4">الدور الوظيفي</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {users.map((u) => {
                  const activeRoleId = u.user_roles?.[0]?.roles?.id || '';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-4 font-mono text-xs text-emerald-600 font-bold whitespace-nowrap flex items-center justify-between gap-2">
                        <span>{u.email}</span>
                        {currentUserRole === 'admin' && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`هل تريد إنشاء رابط إعادة تعيين كلمة المرور الآمن للمشرف: ${u.email}؟`)) {
                                const res = await generateSecureResetTokenAction(u.id, u.email);
                                if (res.success && res.resetLink) {
                                  prompt('تم إنشاء الرابط المؤقت بنجاح (صالح لمدة ساعة واحدة حصرياً):', res.resetLink);
                                } else {
                                  alert(res.error || 'فشل توليد الرابط.');
                                }
                              }
                            }}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-bold text-[10px] rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                            title="توليد رابط آمن ومؤقت لتغيير كلمة المرور"
                          >
                            <span>🔑</span> رابط التعيين
                          </button>
                        )}
                      </td>
                      <td className="p-4 text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">{u.full_name || '---'}</td>
                      
                      <td className="p-4 whitespace-nowrap">
                        <select
                          value={activeRoleId}
                          disabled={isPending || u.id === currentUserId}
                          onChange={(e) => handleUserRoleChange(u.id, e.target.value)}
                          className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                        >
                          <option value="">اختر دوراً...</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.display_name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          u.is_blocked 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : u.is_active 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-rose-50 text-rose-700'
                        }`}>
                          {u.is_blocked ? 'محظور (خطأ دخول)' : u.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </td>

                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {u.is_blocked ? (
                            <button
                              onClick={async () => {
                                const res = await unblockUserAction(u.id);
                                if (res.success) {
                                  setMessage({ text: 'تمت عملية فك الحظر بنجاح.', type: 'success' });
                                  window.location.reload();
                                } else {
                                  alert(res.error);
                                }
                              }}
                              disabled={isPending}
                              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-sm transition-all"
                            >
                              فك الحظر
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                const res = await toggleUserStatusAction(u.id, u.is_active);
                                if (res.success) window.location.reload();
                              }}
                              disabled={u.id === currentUserId}
                              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer disabled:opacity-40"
                            >
                              {u.is_active ? 'تعطيل' : 'تفعيل'}
                            </button>
                          )}

                          <button
                            onClick={async () => {
                              if (confirm('هل أنت متأكد من حذف هذا المشرف؟')) {
                                const res = await deleteUserAction(u.id);
                                if (res.success) window.location.reload();
                              }
                            }}
                            disabled={u.id === currentUserId}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 cursor-pointer disabled:opacity-40"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">إدارة صلاحيات الأقسام والأدوار</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">تحديد الصلاحيات مرتبة حسب صفحات النظام لكل دور وظيفي.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">اختر الدور المستهدف:</label>
            <select
              value={selectedRoleId}
              onChange={(e) => handleRoleSelectChange(e.target.value)}
              className="w-full sm:w-auto bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.display_name} ({r.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  صلاحيات الدور: <span className="text-emerald-600">{currentRole?.display_name}</span>
                </h3>
                <button
                  onClick={handleSavePermissions}
                  disabled={isPending || !selectedRoleId}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>

              <div className="space-y-6">
                {Object.entries(permissionsByModule).map(([modKey, perms]) => (
                  <div key={modKey} className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {moduleNamesArabic[modKey] || modKey}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {perms.map((perm) => {
                        const isChecked = assignedPermissions.includes(perm.id);
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                              isChecked 
                                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-200' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCheckboxToggle(perm.id)}
                              className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 cursor-pointer"
                            />
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold block">{perm.name}</span>
                              <span className="text-[11px] text-slate-400 block leading-tight">{perm.description}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">إضافة صلاحية جديدة</h3>
              <form onSubmit={handleAddPermission} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الصفحة / القسم التابع:</label>
                  <select
                    value={newPermModule}
                    onChange={(e) => setNewPermModule(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="jobs">إدارة الوظائف (Jobs)</option>
                    <option value="careers">طلبات التوظيف (Careers)</option>
                    <option value="customer_service">خدمة العملاء (Customer Service)</option>
                    <option value="requests">طلبات الخدمات (Requests)</option>
                    <option value="messages">الرسائل (Messages)</option>
                    <option value="users">المشرفين والصلاحيات (Users)</option>
                    <option value="general">عام (General)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم الصلاحية البرمجي:</label>
                  <input
                    type="text"
                    required
                    value={newPermName}
                    onChange={(e) => setNewPermName(e.target.value)}
                    placeholder="jobs.export"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-800 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">وصف الصلاحية:</label>
                  <textarea
                    rows={3}
                    value={newPermDesc}
                    onChange={(e) => setNewPermDesc(e.target.value)}
                    placeholder="وصف عمل الصلاحية باختصار..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-white outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer"
                >
                  {isPending ? 'جاري الإضافة...' : 'إضافة الصلاحية للقائمة'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">إضافة مشرف جديد</h3>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">كلمة المرور</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">الدور الوظيفي</label>
                <select
                  value={selectedAddRoleId}
                  onChange={(e) => setSelectedAddRoleId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 py-2 text-sm outline-none cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.display_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer"
                >
                  حفظ المشرف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}