'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase/supabase';
import { careerFormSchema } from '@/lib/validations/validations';
import { submitCareerApplication } from './actions';
import FormErrorBox from '@/components/FormErrorBox';

interface Position {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  positions: Position[]; 
}

interface CareersFormProps {
  lang: 'ar' | 'en';
  t: {
    eyebrow: string;
    title: string;
    description: string;
    form: {
      name: string;
      namePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      phone: string;
      phonePlaceholder: string;
      experience: string;
      experiencePlaceholder: string;
      experienceOptions: {
        fresh: string;
        lessThan1: string;
        oneToTwo: string;
        threeToFive: string;
        moreThan5: string;
      };
      selectDepartment: string;
      selectPosition: string;
      positionPlaceholder: string;
      cvFile: string;
      submit: string;
      success: string;
    };
    departments: Department[];
  };
  jobId?: string;
  jobDetails?: any;
}

export default function CareersForm({ lang, t, jobId, jobDetails }: CareersFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const departments = t?.departments || [];

  const [selectedDeptId, setSelectedDeptId] = useState(
    jobDetails?.department || (departments[0]?.id ?? '')
  );

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: 'من سنة إلى سنتين',
    cvFile: null as File | null
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    cvFile: ''
  });

  const currentDepartmentObj = departments.find((d) => d.id === selectedDeptId) || departments[0];
  const availablePositions = currentDepartmentObj?.positions || [];

  const [selectedPosition, setSelectedPosition] = useState(
    jobDetails?.title || (availablePositions[0]?.id ?? '')
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.cvFile) {
      const errMsg = lang === 'ar' ? 'يرجى إرفاق السيرة الذاتية (PDF)' : 'Please attach your CV (PDF)';
      setErrors((prev) => ({ ...prev, cvFile: errMsg }));
      toast.error(errMsg);
      return;
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      experience: formData.experience,
      department: currentDepartmentObj?.id || selectedDeptId,
      position: jobId && jobDetails ? jobDetails.title : selectedPosition, 
      cvFile: formData.cvFile
    };

    const result = careerFormSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors = result.error.format();
      setErrors({
        name: fieldErrors.name?._errors[0] || '',
        email: fieldErrors.email?._errors[0] || '',
        phone: fieldErrors.phone?._errors[0] || '',
        experience: fieldErrors.experience?._errors[0] || '',
        cvFile: fieldErrors.cvFile?._errors[0] || '',
      });
      const validationMsg = lang === 'ar' ? 'يرجى تصحيح الأخطاء في الحقول أدناه.' : 'Please fix the errors below.';
      setFormError(validationMsg);
      toast.error(validationMsg);
      return;
    }

    setLoading(true);
    try {
      const file = formData.cvFile;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('resumes').upload(filePath, file);
      if (uploadError) throw new Error(uploadError.message);

      const res = await submitCareerApplication({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        experience: formData.experience,
        department: currentDepartmentObj?.id || selectedDeptId,
        position: jobId && jobDetails ? jobDetails.title : selectedPosition,
        cvFilePath: filePath,
        jobId: jobId || null
      });

      if (!res.success) throw new Error(res.message);
      
      setSubmitted(true);
      toast.success(lang === 'ar' ? 'تم إرسال طلبك بنجاح!' : 'Application submitted successfully!');
    } catch (err: any) {
      const errMsg = err.message || (lang === 'ar' ? 'حدث خطأ غير متوقع أثناء إرسال الطلب.' : 'An unexpected error occurred.');
      setFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-12 text-center space-y-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center text-3xl mx-auto shadow-lg">✓</div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          {lang === 'ar' ? 'تم إرسال طلبك بنجاح' : 'Application Submitted Successfully'}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
          {t.form.success}
        </p>
        <div className="pt-2">
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors shadow-sm"
          >
            {lang === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Back to Home'}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="text-center space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
          {t.eyebrow}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          {t.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
          {t.description}
        </p>
      </div>

      {jobId && jobDetails && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {lang === 'ar' ? 'أنت تقدم الآن على الوظيفة:' : 'You are applying for:'}
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{jobDetails.title}</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm"
          >
            <span>ℹ</span>
            <span>{lang === 'ar' ? 'تفاصيل الوظيفة' : 'Job Details'}</span>
          </button>
        </div>
      )}

      <FormErrorBox message={formError} success={false} />

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            {t.form.name}
          </label>
          <input
            type="text"
            placeholder={t.form.namePlaceholder}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-800 focus:ring-emerald-500'}`}
          />
          {errors.name && <p className="text-xs text-red-500 font-semibold">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              {t.form.email}
            </label>
            <input
              type="email"
              placeholder={t.form.emailPlaceholder}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-800 focus:ring-emerald-500'}`}
            />
            {errors.email && <p className="text-xs text-red-500 font-semibold">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              {t.form.phone}
            </label>
            <input
              type="tel"
              placeholder={t.form.phonePlaceholder}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${errors.phone ? 'border-red-500' : 'border-slate-300 dark:border-slate-800 focus:ring-emerald-500'}`}
            />
            {errors.phone && <p className="text-xs text-red-500 font-semibold">{errors.phone}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            {t.form.experience}
          </label>
          <select
            value={formData.experience}
            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="Fresh Graduate (No Experience)">{t.form.experienceOptions.fresh}</option>
            <option value="Less than 1 year">{t.form.experienceOptions.lessThan1}</option>
            <option value="1-2 years">{t.form.experienceOptions.oneToTwo}</option>
            <option value="3-5 years">{t.form.experienceOptions.threeToFive}</option>
            <option value="More than 5 years">{t.form.experienceOptions.moreThan5}</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            {t.form.selectDepartment}
          </label>
          <select
            value={selectedDeptId}
            onChange={(e) => {
              setSelectedDeptId(e.target.value);
              const dept = departments.find((d) => d.id === e.target.value);
              if (dept && dept.positions.length > 0) {
                setSelectedPosition(dept.positions[0].id); 
              }
            }}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 cursor-pointer"
          >
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {!jobId && (
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              {t.form.selectPosition}
            </label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="" disabled>{t.form.positionPlaceholder}</option>
              {availablePositions.map((pos: Position) => (
                <option key={pos.id} value={pos.id}>
                  {pos.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            {t.form.cvFile}
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFormData({ ...formData, cvFile: e.target.files?.[0] || null })}
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 dark:file:bg-emerald-950 dark:file:text-emerald-300 hover:file:bg-emerald-100 cursor-pointer"
          />
          {errors.cvFile && <p className="text-xs text-red-500 font-semibold">{errors.cvFile}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 mt-2"
        >
          {loading 
            ? (lang === 'ar' ? 'جاري إرسال الطلب...' : 'Submitting Application...') 
            : (lang === 'ar' ? 'إرسال الطلب' : t.form.submit)}
        </button>
      </form>

      {isModalOpen && jobDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  {jobDetails.department || 'General'}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">{jobDetails.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 max-h-[60vh] overflow-y-auto leading-relaxed whitespace-pre-line">
              <p>{jobDetails.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
              <span>{jobDetails.deadline ? `Deadline: ${jobDetails.deadline.split('T')[0]}` : ''}</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold hover:bg-slate-800 transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}