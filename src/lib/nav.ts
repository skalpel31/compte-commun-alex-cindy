import {
  LayoutGrid,
  Wallet,
  GitFork,
  Receipt,
  FileText,
  PiggyBank,
  Target,
  Landmark,
  LineChart,
  Sparkles,
  Bell,
  HeartPulse,
  UtensilsCrossed,
  ShoppingCart,
  Footprints,
  Dumbbell,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { isLockedPath } from "@/lib/modules";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  locked: boolean;
};

const items: Omit<NavItem, "locked">[] = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutGrid },
  { href: "/comptes", label: "Comptes", icon: Wallet },
  { href: "/flux-argent", label: "Flux d'argent", icon: GitFork },
  { href: "/transactions", label: "Dépenses", icon: Receipt },
  { href: "/bills", label: "Factures", icon: FileText },
  { href: "/budgets", label: "Budgets & Enveloppes", icon: PiggyBank },
  { href: "/objectifs", label: "Objectifs", icon: Target },
  { href: "/epargne", label: "Épargne", icon: Landmark },
  { href: "/sante", label: "Santé", icon: HeartPulse },
  { href: "/nutrition", label: "Nutrition", icon: UtensilsCrossed },
  { href: "/courses", label: "Courses", icon: ShoppingCart },
  { href: "/course-a-pied", label: "Course à pied", icon: Footprints },
  { href: "/calisthenics", label: "Calisthenics", icon: Dumbbell },
  { href: "/simulations", label: "Simulations", icon: LineChart },
  { href: "/conseiller-ia", label: "Conseiller IA", icon: Sparkles },
  { href: "/alertes", label: "Alertes", icon: Bell },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

// Verrouillage piloté par src/lib/modules.ts.
export const navItems: NavItem[] = items.map((item) => ({
  ...item,
  locked: isLockedPath(item.href),
}));

export const mobileNavItems: NavItem[] = [
  { href: "/dashboard", label: "Accueil", icon: LayoutGrid, locked: false },
  { href: "/comptes", label: "Comptes", icon: Wallet, locked: false },
  { href: "/budgets", label: "Budgets", icon: PiggyBank, locked: false },
];

export const moreNavItems = navItems.filter(
  (item) => !mobileNavItems.some((m) => m.href === item.href)
);
