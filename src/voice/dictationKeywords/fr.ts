import type { DictationKeyword } from './types';

/**
 * Bounded, representative vocabulary (US-021b) — not an exhaustive dictionary. Order matters: the
 * first keyword found in the transcript wins, so more specific words are listed before generic
 * ones that could also appear alongside them (e.g. "café" before "restaurant").
 */
export const FR_DICTATION_KEYWORDS: DictationKeyword[] = [
  { keyword: 'café', label: 'Café', categoryIcon: 'utensils' },
  { keyword: 'restaurant', label: 'Restaurant', categoryIcon: 'utensils' },
  { keyword: 'déjeuner', label: 'Déjeuner', categoryIcon: 'utensils' },
  { keyword: 'dîner', label: 'Dîner', categoryIcon: 'utensils' },
  { keyword: 'essence', label: 'Essence', categoryIcon: 'car' },
  { keyword: 'taxi', label: 'Taxi', categoryIcon: 'car' },
  { keyword: 'bus', label: 'Bus', categoryIcon: 'car' },
  { keyword: 'pharmacie', label: 'Pharmacie', categoryIcon: 'health' },
  { keyword: 'médecin', label: 'Médecin', categoryIcon: 'health' },
  { keyword: 'loyer', label: 'Loyer', categoryIcon: 'home' },
  { keyword: 'électricité', label: 'Électricité', categoryIcon: 'receipt' },
  { keyword: 'facture', label: 'Facture', categoryIcon: 'receipt' },
  { keyword: 'école', label: 'École', categoryIcon: 'school' },
  { keyword: 'cinéma', label: 'Cinéma', categoryIcon: 'film' },
  { keyword: 'courses', label: 'Courses', categoryIcon: 'cart' },
  { keyword: 'supermarché', label: 'Supermarché', categoryIcon: 'cart' },
];
