import { createElement } from "react";
import {
  Banknote,
  Car,
  Cigarette,
  Dumbbell,
  Fuel,
  GraduationCap,
  Heart,
  Home,
  MoreHorizontal,
  PartyPopper,
  PiggyBank,
  Repeat,
  Shield,
  ShoppingCart,
  Smartphone,
  Tag,
  User,
  Users,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "shopping-cart": ShoppingCart,
  home: Home,
  car: Car,
  repeat: Repeat,
  "party-popper": PartyPopper,
  "heart-pulse": Heart,
  "more-horizontal": MoreHorizontal,
  wallet: Wallet,
  user: User,
  users: Users,
  "piggy-bank": PiggyBank,
  shield: Shield,
  cigarette: Cigarette,
  fuel: Fuel,
  banknote: Banknote,
  utensils: UtensilsCrossed,
  "graduation-cap": GraduationCap,
  dumbbell: Dumbbell,
  smartphone: Smartphone,
};

/** Shared with every icon picker (category creation, budget creation) so the choices stay identical everywhere. */
export const CATEGORY_ICON_LABELS: Record<string, string> = {
  "shopping-cart": "Courses",
  home: "Logement",
  car: "Voiture",
  repeat: "Abonnement",
  "party-popper": "Loisirs",
  "heart-pulse": "Santé",
  wallet: "Salaire / Argent",
  "piggy-bank": "Épargne",
  shield: "Assurance",
  cigarette: "Cigarettes",
  fuel: "Essence",
  banknote: "Prêt / Emprunt",
  utensils: "Restaurant",
  "graduation-cap": "Scolaire",
  dumbbell: "Sport",
  smartphone: "Téléphonie",
  user: "Personne",
  users: "Foyer",
  "more-horizontal": "Autre",
};

export const CATEGORY_ICON_OPTIONS = Object.keys(CATEGORY_ICON_LABELS);

export function categoryIcon(icon: string | null): LucideIcon {
  return (icon && ICONS[icon]) || Tag;
}

export function CategoryIcon({ icon, className }: { icon: string | null; className?: string }) {
  return createElement(categoryIcon(icon), { className });
}

const BG: Record<string, string> = {
  "chart-1": "bg-chart-1",
  "chart-2": "bg-chart-2",
  "chart-3": "bg-chart-3",
  "chart-4": "bg-chart-4",
  "chart-5": "bg-chart-5",
  "chart-6": "bg-chart-6",
  "chart-7": "bg-chart-7",
  "chart-8": "bg-chart-8",
};

const TEXT: Record<string, string> = {
  "chart-1": "text-chart-1",
  "chart-2": "text-chart-2",
  "chart-3": "text-chart-3",
  "chart-4": "text-chart-4",
  "chart-5": "text-chart-5",
  "chart-6": "text-chart-6",
  "chart-7": "text-chart-7",
  "chart-8": "text-chart-8",
};

export function categoryBg(color: string | null): string {
  return (color && BG[color]) || "bg-muted-foreground";
}

export function categoryText(color: string | null): string {
  return (color && TEXT[color]) || "text-muted-foreground";
}

const CHART_SLOTS = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "chart-6",
  "chart-7",
  "chart-8",
];

/**
 * Plain function (no "use client") so both server components (e.g. the
 * Épargne page) and client components (e.g. the money-flow diagram) can
 * call it directly — a server component can't call a function exported
 * from a "use client" module, only render its components.
 */
export function nextPocketColor(pockets: { color: string }[]): string {
  const usedColors = new Set(pockets.map((p) => p.color));
  return CHART_SLOTS.find((c) => !usedColors.has(c)) ?? CHART_SLOTS[0];
}
