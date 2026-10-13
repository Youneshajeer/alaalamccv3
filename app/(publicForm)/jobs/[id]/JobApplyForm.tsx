'use client';

import { useTranslation } from '@/utils/useTranslation';
import { useState } from 'react';
import { applyForJobAction } from './actions'; 
import ar from '@/i18n/ar.json';
import en from '@/i18n/en.json';

const dictionaries = { ar, en };

interface JobApplyFormProps {
  jobId: string;
  isClosed?: boolean;
}

export default function JobApplyForm({ jobId, isClosed }: JobApplyFormProps) {
  const { lang } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');

  if (isClosed) {
    return (
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm font-semibold text-center">
        نأسف، التقديم مغلق حالياً لهذه الوظيفة.
      </div>
    );
  }

  const currentLang = (lang === 'en' ? 'en' : 'ar') as 'ar' | 'en';
  const t: any = dictionaries[currentLang] || dictionaries.ar;
  const careers = t.careers || ar.careers;
  const formText = careers.form || {};
  const departments = careers.departments || ar.careers.departments || [];
  const experienceOptions = t.experienceOptions || ar.experienceOptions || {};
  
  const selectedDept = departments.find((d: any) => d.id === selectedDeptId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    formData.append('jobId', jobId);
    formData.append('departmentId', selectedDeptId);
    formData.append('position', selectedPosition);

    try {
      const result = await applyForJobAction(formData);
      setMessage({ success: result.success, text: result.message });
      if (result.success) {
        event.currentTarget.reset();
        setSelectedDeptId('');
        setSelectedPosition('');
      }
    } catch (error) {
      setMessage({ success: false, text: 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 relative z-30" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      {message && (
        <div className={`p-4 rounded-lg text-sm ${message.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {formText.name || 'الاسم الكامل'}
        </label>
        <input 
          type="text" 
          name="fullName" 
          required 
          placeholder={formText.namePlaceholder || 'أدخل اسمك الكامل'}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {formText.email || 'البريد الإلكتروني'}
          </label>
          <input 
            type="email" 
            name="email" 
            required 
            placeholder={formText.emailPlaceholder || 'name@domain.com'}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {formText.phone || 'رقم الهاتف'}
          </label>
          <input 
            type="tel" 
            name="phone" 
            required 
            placeholder={formText.phonePlaceholder || '05XXXXXXXX'}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {formText.experience || 'عدد سنوات الخبرة'}
        </label>
        <select 
          name="experience" 
          required 
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer pointer-events-auto"
        >
          <option value="">{formText.experiencePlaceholder || 'اختر عدد سنوات الخبرة...'}</option>
          {Object.entries(experienceOptions).map(([key, label]) => (
            <option key={key} value={key}>
              {String(label)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {formText.selectDepartment || 'اختر القسم أو التخصص'}
        </label>
        <select 
          value={selectedDeptId}
          onChange={(e) => {
            setSelectedDeptId(e.target.value);
            setSelectedPosition(''); // تصفير المسمى عند تغيير القسم لتفعيل القائمة التابعة
          }}
          required
          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer pointer-events-auto relative z-40"
        >
          <option value="">{formText.selectDepartment || 'اختر التخصص المناسب...'}</option>
          {departments.map((dept: any) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>
<div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {formText.selectDepartment || 'اختر القسم أو التخصص'}
        </label>
        <select 
          value={selectedDeptId}
          onChange={(e) => {
            setSelectedDeptId(e.target.value);
            setSelectedPosition(''); 
          }}
          required
          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer pointer-events-auto relative z-40"
        >
          <option value="">{formText.selectDepartment || 'اختر التخصص المناسب...'}</option>
          {departments.map((dept: any) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>
        
<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">{t.form.selectDepartment || 'اختر القسم أو التخصص'}</label>
  <select 
    name="departmentId"
    value={selectedDeptId}
    onChange={(e) => {
      setSelectedDeptId(e.target.value);
      setSelectedPosition(''); 
    }}
    required
    disabled={false} 
    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer pointer-events-auto"
  >
    <option value="">{t.form.selectDepartment || 'اختر التخصص المناسب'}</option>
    {t.departments.map((dept: any) => (
      <option key={dept.id} value={dept.id}>
        {dept.name}
      </option>
    ))}
  </select>
</div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {formText.cvFile || 'السيرة الذاتية (PDF)'}
        </label>
        <input 
          type="file" 
          name="cv" 
          accept=".pdf,.doc,.docx" 
          required 
          className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" 
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-500 transition disabled:opacity-50 shadow-lg shadow-emerald-600/20 cursor-pointer pointer-events-auto"
      >
        {loading ? 'جاري الإرسال...' : (formText.submit || 'إرسال طلب التوظيف')}
      </button>
    </form>
  );
}