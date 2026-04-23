-- Create 6 demo employer auth users + profiles + jobs
DO $$
DECLARE
  v_emp1 UUID := gen_random_uuid();
  v_emp2 UUID := gen_random_uuid();
  v_emp3 UUID := gen_random_uuid();
  v_emp4 UUID := gen_random_uuid();
  v_emp5 UUID := gen_random_uuid();
  v_emp6 UUID := gen_random_uuid();
BEGIN
  -- Insert demo profiles directly (skip auth.users to avoid coupling).
  -- We temporarily disable FK to auth.users for this seed.
  ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;

  INSERT INTO public.profiles (id, email, full_name, role, company_name) VALUES
    (v_emp1, 'tech@demo.sa', 'شركة تك السعودية', 'employer', 'تك السعودية'),
    (v_emp2, 'sales@demo.sa', 'مجموعة الجزيرة التجارية', 'employer', 'الجزيرة التجارية'),
    (v_emp3, 'finance@demo.sa', 'مكتب الخليج للمحاسبة', 'employer', 'الخليج للمحاسبة'),
    (v_emp4, 'hospitality@demo.sa', 'فنادق الكعبة', 'employer', 'فنادق الكعبة'),
    (v_emp5, 'logistics@demo.sa', 'لوجستيات طيبة', 'employer', 'لوجستيات طيبة'),
    (v_emp6, 'edu@demo.sa', 'مدارس عسير الأهلية', 'employer', 'مدارس عسير');

  -- Re-add FK with NOT VALID so future rows must reference auth.users
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id)
    REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;

  INSERT INTO public.jobs (
    employer_id, title, description, latitude, longitude, location_name,
    required_education, required_field, required_experience, required_skills, required_languages
  ) VALUES
  (v_emp1, 'مهندس برمجيات Backend', 'تطوير وصيانة خدمات الويب باستخدام Node.js وPostgreSQL ضمن فريق تقني محترف.',
    24.7136, 46.6753, 'الرياض - حي العليا',
    'بكالوريوس', 'تقنية المعلومات', '3-5 سنوات',
    ARRAY['Node.js','PostgreSQL','TypeScript','Git'], ARRAY['العربية','الإنجليزية']),

  (v_emp2, 'مدير مبيعات', 'قيادة فريق المبيعات في المنطقة الغربية وتحقيق الأهداف الشهرية والربعية.',
    21.4858, 39.1925, 'جدة - حي الشاطئ',
    'بكالوريوس', 'إدارة الأعمال', '5-10 سنوات',
    ARRAY['التفاوض','إدارة الفرق','CRM'], ARRAY['العربية','الإنجليزية']),

  (v_emp3, 'محاسب أول', 'إعداد القوائم المالية الشهرية والإقرارات الضريبية ومتابعة الذمم.',
    26.4207, 50.0888, 'الدمام - حي الفيصلية',
    'بكالوريوس', 'المحاسبة', '3-5 سنوات',
    ARRAY['Excel','SAP','الزكاة والضريبة'], ARRAY['العربية']),

  (v_emp4, 'موظف استقبال', 'استقبال نزلاء الفندق وإتمام إجراءات الحجز والمغادرة بأعلى معايير الضيافة.',
    21.4225, 39.8262, 'مكة المكرمة - العزيزية',
    'دبلوم', 'الضيافة', '1-3 سنوات',
    ARRAY['خدمة العملاء','Opera PMS'], ARRAY['العربية','الإنجليزية']),

  (v_emp5, 'مشرف مستودع', 'الإشراف على عمليات الاستلام والتخزين والشحن وضمان دقة المخزون.',
    24.5247, 39.5692, 'المدينة المنورة - المنطقة الصناعية',
    'دبلوم', 'اللوجستيات', '3-5 سنوات',
    ARRAY['إدارة المخزون','WMS','السلامة المهنية'], ARRAY['العربية']),

  (v_emp6, 'معلم رياضيات', 'تدريس مادة الرياضيات للمرحلة الثانوية وفق المناهج المعتمدة.',
    18.2164, 42.5053, 'أبها - حي المنسك',
    'بكالوريوس', 'التعليم', '1-3 سنوات',
    ARRAY['تخطيط الدروس','التقييم','التعلم النشط'], ARRAY['العربية']);
END $$;