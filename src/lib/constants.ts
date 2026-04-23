export const EDUCATION_LEVELS = [
  "ثانوية",
  "دبلوم",
  "بكالوريوس",
  "ماجستير",
  "دكتوراه",
] as const;

export const EXPERIENCE_RANGES = [
  "أقل من سنة",
  "1-3 سنوات",
  "3-5 سنوات",
  "5-10 سنوات",
  "أكثر من 10 سنوات",
] as const;

export const LANGUAGES = [
  "العربية",
  "الإنجليزية",
  "الفرنسية",
  "غير ذلك",
] as const;

export const SAUDI_CENTER: [number, number] = [24.7, 46.7];
export const SAUDI_ZOOM = 6;

export type EducationLevel = (typeof EDUCATION_LEVELS)[number];
export type ExperienceRange = (typeof EXPERIENCE_RANGES)[number];
export type Language = (typeof LANGUAGES)[number];
