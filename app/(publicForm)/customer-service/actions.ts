'use server';
import { customerServiceSchema } from '@/lib/validations/adminValidations'; 
import { getSupabaseAdminClient } from '@/lib/supabase/supabase-server';
const supabase = getSupabaseAdminClient();
export async function submitCustomerService(prevState: any, formData: FormData) {
  try {
    const rawData = {
      company: formData.get('company'),
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      message: formData.get('message'),
    };

    const validatedFields = customerServiceSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.flatten().fieldErrors,
        fields: rawData, 
        message: 'Please correct the errors in the fields below.',
      };
    }

    const { error } = await supabase
      .from('customer_service')
      .insert([
        {
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
        fields: rawData,
        message: 'An error occurred while sending your message. Please try again later.',
      };
    }

    return {
      success: true,
      message: 'Your message has been sent successfully. We will contact you soon.',
    };
  } catch (err) {
    console.error('Server Error:', err);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}