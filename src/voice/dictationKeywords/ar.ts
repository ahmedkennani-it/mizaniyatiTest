import type { DictationKeyword } from './types';

/** See `fr.ts` for the scope note — same bounded, representative vocabulary in Arabic. */
export const AR_DICTATION_KEYWORDS: DictationKeyword[] = [
  { keyword: 'قهوة', label: 'قهوة', categoryIcon: 'utensils' },
  { keyword: 'مطعم', label: 'مطعم', categoryIcon: 'utensils' },
  { keyword: 'غداء', label: 'غداء', categoryIcon: 'utensils' },
  { keyword: 'عشاء', label: 'عشاء', categoryIcon: 'utensils' },
  { keyword: 'بنزين', label: 'بنزين', categoryIcon: 'car' },
  { keyword: 'تاكسي', label: 'تاكسي', categoryIcon: 'car' },
  { keyword: 'حافلة', label: 'حافلة', categoryIcon: 'car' },
  { keyword: 'صيدلية', label: 'صيدلية', categoryIcon: 'health' },
  { keyword: 'طبيب', label: 'طبيب', categoryIcon: 'health' },
  { keyword: 'كراء', label: 'كراء', categoryIcon: 'home' },
  { keyword: 'إيجار', label: 'إيجار', categoryIcon: 'home' },
  { keyword: 'كهرباء', label: 'كهرباء', categoryIcon: 'receipt' },
  { keyword: 'فاتورة', label: 'فاتورة', categoryIcon: 'receipt' },
  { keyword: 'مدرسة', label: 'مدرسة', categoryIcon: 'school' },
  { keyword: 'سينما', label: 'سينما', categoryIcon: 'film' },
  { keyword: 'تسوق', label: 'تسوق', categoryIcon: 'cart' },
  { keyword: 'سوبرماركت', label: 'سوبرماركت', categoryIcon: 'cart' },
];
