import { createElement } from "react";
import {
  Car,
  Heart,
  Home,
  MoreHorizontal,
  PartyPopper,
  PiggyBank,
  Repeat,
  ShoppingCart,
  Tag,
  User,
  Users,
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
};

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
