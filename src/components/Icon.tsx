import React from 'react';
import { I18nManager } from 'react-native';
import {
  AlarmClock,
  ArrowDownLeft,
  ArrowUpRight,
  Ban,
  Banknote,
  BatteryFull,
  Bell,
  Calculator,
  Calendar,
  CalendarClock,
  Car,
  CarTaxiFront,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  Clock,
  Coffee,
  Delete,
  Gift,
  Globe,
  GraduationCap,
  HandHeart,
  Handshake,
  HeartPulse,
  House,
  LayoutGrid,
  Lock,
  MapPin,
  Mic,
  Moon,
  MoonStar,
  PartyPopper,
  PiggyBank,
  Plane,
  Plus,
  ShieldCheck,
  ShoppingBasket,
  ShoppingCart,
  Signal,
  Smartphone,
  Tag,
  TriangleAlert,
  Type,
  User,
  Users,
  Utensils,
  UtensilsCrossed,
  Wifi,
  X,
} from 'lucide-react-native';

import { useTheme } from '../theme';

/** Stable app-facing icon names (kebab-case, matching the design mockup) → lucide components. */
const ICONS = {
  house: House,
  home: House,
  'layout-grid': LayoutGrid,
  handshake: Handshake,
  user: User,
  users: Users,
  plus: Plus,
  mic: Mic,
  'shield-check': ShieldCheck,
  bell: Bell,
  globe: Globe,
  moon: Moon,
  'moon-star': MoonStar,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'shopping-cart': ShoppingCart,
  'shopping-basket': ShoppingBasket,
  'graduation-cap': GraduationCap,
  banknote: Banknote,
  utensils: Utensils,
  'utensils-crossed': UtensilsCrossed,
  calculator: Calculator,
  calendar: Calendar,
  'calendar-clock': CalendarClock,
  'party-popper': PartyPopper,
  'check-circle': CircleCheckBig,
  clock: Clock,
  'alarm-clock': AlarmClock,
  'alert-triangle': TriangleAlert,
  'alert-circle': CircleAlert,
  'hand-heart': HandHeart,
  gift: Gift,
  coffee: Coffee,
  'map-pin': MapPin,
  lock: Lock,
  ban: Ban,
  smartphone: Smartphone,
  delete: Delete,
  x: X,
  plane: Plane,
  car: Car,
  'car-taxi-front': CarTaxiFront,
  'piggy-bank': PiggyBank,
  'heart-pulse': HeartPulse,
  'arrow-up-right': ArrowUpRight,
  'arrow-down-left': ArrowDownLeft,
  type: Type,
  wifi: Wifi,
  signal: Signal,
  'battery-full': BatteryFull,
  tag: Tag,
} as const;

export type IconName = keyof typeof ICONS;

/** Directional icons that must mirror horizontally in RTL layouts. */
const RTL_FLIP = new Set<IconName>([
  'chevron-left',
  'chevron-right',
  'arrow-up-right',
  'arrow-down-left',
]);

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Single icon primitive wrapping `lucide-react-native`, so the rest of the app references stable
 * kebab-case names (decoupled from lucide's export names, which shift between versions) and Jest
 * can mock one module. Directional icons auto-mirror in RTL. `color` defaults to the primary text
 * color. `testID`/`accessibilityLabel` are set to the icon name so tests can assert its presence.
 */
export function Icon({ name, size = 20, color, strokeWidth = 2 }: IconProps) {
  const { theme } = useTheme();
  const LucideIcon = ICONS[name];
  const flip = I18nManager.isRTL && RTL_FLIP.has(name);

  return (
    <LucideIcon
      size={size}
      color={color ?? theme.colors.textPrimary}
      strokeWidth={strokeWidth}
      testID={`icon-${name}`}
      accessibilityLabel={name}
      style={flip ? { transform: [{ scaleX: -1 }] } : undefined}
    />
  );
}
