import type { DictationKeyword } from './types';

/** See `fr.ts` for the scope note — same bounded, representative vocabulary in English. */
export const EN_DICTATION_KEYWORDS: DictationKeyword[] = [
  { keyword: 'coffee', label: 'Coffee', categoryIcon: 'utensils' },
  { keyword: 'restaurant', label: 'Restaurant', categoryIcon: 'utensils' },
  { keyword: 'lunch', label: 'Lunch', categoryIcon: 'utensils' },
  { keyword: 'dinner', label: 'Dinner', categoryIcon: 'utensils' },
  { keyword: 'gas', label: 'Gas', categoryIcon: 'car' },
  { keyword: 'fuel', label: 'Fuel', categoryIcon: 'car' },
  { keyword: 'taxi', label: 'Taxi', categoryIcon: 'car' },
  { keyword: 'bus', label: 'Bus', categoryIcon: 'car' },
  { keyword: 'pharmacy', label: 'Pharmacy', categoryIcon: 'health' },
  { keyword: 'doctor', label: 'Doctor', categoryIcon: 'health' },
  { keyword: 'rent', label: 'Rent', categoryIcon: 'home' },
  { keyword: 'electricity', label: 'Electricity', categoryIcon: 'receipt' },
  { keyword: 'bill', label: 'Bill', categoryIcon: 'receipt' },
  { keyword: 'school', label: 'School', categoryIcon: 'school' },
  { keyword: 'movie', label: 'Movie', categoryIcon: 'film' },
  { keyword: 'cinema', label: 'Cinema', categoryIcon: 'film' },
  { keyword: 'groceries', label: 'Groceries', categoryIcon: 'cart' },
  { keyword: 'supermarket', label: 'Supermarket', categoryIcon: 'cart' },
];
