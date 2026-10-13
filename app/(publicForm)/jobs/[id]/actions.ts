'use server'

import { getSupabaseServerClient } from '@/lib/supabase/supabase-server'; 

export async function applyForJobAction(formData: FormData) {
  const supabase =await getSupabaseServerClient();

  try {
    const jobId = formData.get('jobId') as string;
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const experience = formData.get('experience') as string;
    const departmentId = formData.get('departmentId') as string;
    const position = formData.get('position') as string;
    const cvFile = formData.get('cv') as File;

    // 1. التحقق من وجود ملف السيرة الذاتية
    if (!cvFile || cvFile.size === 0) {
      return { success: false, message: 'يرجى إرفاق ملف السيرة الذاتية (CV).' };
    }

    // 2. رفع ملف السيرة الذاتية إلى Supabase Storage (Bucket باسم careers-cvs أو resumes)
    const fileExt = cvFile.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `resumes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('resumes') 
      .upload(filePath, cvFile);

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError);
      return { success: false, message: 'فشل رفع ملف السيرة الذاتية، يرجى المحاولة لاحقاً.' };
    }

    const { data: publicUrlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);

    const cv_url = publicUrlData.publicUrl;

    const { error: insertError } = await supabase.from('careers').insert([
      {
        name: fullName,
        email: email,
        phone: phone,
        experience: experience || 'غير محدد',
        department: departmentId || 'عام',
        position: position || 'تقديم عام',
        job_id: jobId && jobId.trim() !== '' ? jobId : null, // ربط الوظيفة إن وُجدت أو تركها فارغة للتقديم العام
        cv_url: cv_url,
        status: 'pending'
      }
    ]);

    if (insertError) {
      console.error('Database Insert Error:', insertError);
      return { success: false, message: 'حدث خطأ أثناء حفظ بيانات الطلب في قاعدة البيانات.' };
    }

    return { success: true, message: 'تم إرسال طلب التقديم بنجاح!' };
  } catch (error) {
    console.error('Unexpected Error:', error);
    return { success: false, message: 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.' };
  }
}