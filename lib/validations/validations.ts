import { z } from 'zod';



export const careerFormSchema = z.object({

  name: z.string().min(3, { message: "الاسم يجب أن يكون 3 أحرف على الأقل." }),

  email: z.string().email({ message: "صيغة البريد الإلكتروني غير صحيحة." }),

  phone: z.string().regex(/^[\+]?[\d\s-]{8,15}$/, { message: "رقم الجوال غير صالح." }),

  experience: z.string().min(1, { message: "الرجاء اختيار سنوات الخبرة." }),

  department: z.string().min(1, { message: "الرجاء اختيار القسم الرئيسي." }),

  position: z.string().min(1, { message: "الرجاء اختيار المسمى الوظيفي." }),

  cvFile: z.any().refine((file) => file instanceof File && file.type === 'application/pdf', {

    message: "الرجاء إرفاق السيرة الذاتية بصيغة PDF فقط.",

  }),

});
export const requestServiceSchema = z.object({
  service: z.string().min(1, 'الخدمة المطلوبة مطلوبة'),
  company: z.string().min(1, 'اسم الشركة أو الجهة مطلوب'),
  name: z.string().min(2, 'الاسم الكامل مطلوب'),
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة'),
  phone: z.string().min(8, 'رقم الجوال غير صحيح أو قصير جداً'),
  message: z.string().min(5, 'تفاصيل الطلب مطلوبة'),
});