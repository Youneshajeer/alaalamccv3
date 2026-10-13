'use server';

import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import { requestServiceSchema } from '@/lib/validations/validations';
import { createClient } from '@supabase/supabase-js';

const supabase = await getSupabaseAdminClient();


export async function submitServiceRequest(prevState: any, formData: FormData) {
  try {
    const rawData = {
      service: formData.get('service'),
      company: formData.get('company'),
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      message: formData.get('message'),
    };

    const validatedFields = requestServiceSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.flatten().fieldErrors,
        fields: rawData, 
        message: 'Please correct the errors in the fields below.',
      };
    }

    const { error } = await supabase
      .from('request-service')
      .insert([
        {
          service: validatedFields.data.service,
          company: validatedFields.data.company,
          name: validatedFields.data.name,
          email: validatedFields.data.email,
          phone: validatedFields.data.phone,
          message: validatedFields.data.message,
          status: 'unread',
        },
      ]);

    if (error) {
      console.error('Supabase Error:', error);
      return {
        success: false,
        message: 'An error occurred while saving the request. Please try again later.',
      };
    }

    return {
      success: true,
      message: 'Your request has been submitted successfully, and our team will contact you soon.',
    };
  } catch (err) {
    console.error('Server Error:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}