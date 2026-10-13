import { z } from 'zod';


export const applicationStatusSchema = z.enum([
  'pending',
  'review',
  'accepted',
  'rejected',
]);

export const applicationIdSchema = z
  .string()
  .trim()
  .min(1, 'Invalid application ID');

export const cvPathSchema = z
  .string()
  .trim()
  .min(1, 'CV path is required');

export const updateApplicationStatusSchema = z.object({
  id: applicationIdSchema,
  status: applicationStatusSchema,
});

export const deleteApplicationSchema = z.object({
  id: applicationIdSchema,
  cvUrl: cvPathSchema,
});

export const cvPathRequestSchema = z.object({
  cvPath: cvPathSchema,
});

export type ApplicationStatus = z.infer<
  typeof applicationStatusSchema
>;

export type UpdateApplicationStatusInput = z.infer<
  typeof updateApplicationStatusSchema
>;

export type DeleteApplicationInput = z.infer<
  typeof deleteApplicationSchema
>;

export type CvPathRequest = z.infer<
  typeof cvPathRequestSchema
>;


export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف'),
});
export const createUserSchema = z.object({
  fullName: z.string().trim().min(2, { message: 'الاسم الكامل مطلوب بشكل صحيح.' }),
  email: z.string().trim().email({ message: 'البريد الإلكتروني غير صالح.' }),
  password: z.string().min(6, { message: 'كلمة المرور يجب ألا تقل عن 6 أحرف.' }),
});

export const toggleUserStatusSchema = z.object({
  id: z.string().uuid('معرف المستخدم غير صالح'),
  isActive: z.boolean(),
});

export const updateUserRoleSchema = z.object({
  id: z.string().uuid('معرف المستخدم غير صالح'),
  role: z.enum(['admin', 'supervisor'], {
    message: 'نوع الصلاحية غير صالح',
  }),
});

export const deleteUserSchema = z.object({
  id: z.string().uuid('معرف المستخدم غير صالح'),
});
export const JobSchema = z.object({
  title: z.string().min(3, 'عنوان الوظيفة يجب أن يكون 3 أشكال على الأقل'),
  description: z.string().min(10, 'وصف الوظيفة يجب أن يكون 10 أحرف على الأقل'),
  experience_years: z.number().min(0, 'سنوات الخبرة يجب أن تكون رقم موجباً'),
  deadline: z.string().optional().nullable(),
  status: z.enum(['active', 'closed', 'draft']).default('active'),
});


export const JobApplicationSchema = z.object({
  job_id: z.string().uuid('معرف الوظيفة غير صالح'),
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  phone: z.string().min(8, 'رقم الهاتف غير صحيح'),
});
export const customerServiceSchema = z.object({
  company: z.string().min(1, 'Company or entity name is required'),
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(8, 'Phone number is invalid or too short'),
  message: z.string().min(5, 'Message content is required'),
});
