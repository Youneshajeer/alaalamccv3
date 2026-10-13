'use server'

import { supabase } from '@/lib/supabase/supabase';

interface CareerSubmissionData {
  name: string;
  email: string;
  phone: string;
  experience: string;
  department: string;
  position: string;
  cvFilePath: string;
  jobId?: string | null;
}

export async function submitCareerApplication(data: CareerSubmissionData) {
  try {
    const { error } = await supabase.from('careers').insert([
      {
        name: data.name,
        email: data.email,
        phone: data.phone,
        experience: data.experience,
        department: data.department, 
        position: data.position,       
        cv_url: data.cvFilePath,
        status: 'pending',
        job_id: data.jobId || null,    
      },
    ]);

    if (error) {
      console.error('Supabase insertion error:', error);
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Application submitted successfully' };
  } catch (err: any) {
    console.error('Unexpected error:', err);
    return { success: false, message: err.message || 'حدث خطأ غير متوقع' };
  }
}