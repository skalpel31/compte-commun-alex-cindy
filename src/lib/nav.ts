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
} from "lucide-react";

export const navItems = [
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
] as const;

export const mobileNavItems = [
  { href: "/dashboard", label: "Accueil", icon: LayoutGrid },
  { href: "/comptes", label: "Comptes", icon: Wallet },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
] as const;

export const moreNavItems = navItems.filter(
  (item) => !mobileNavItems.some((m) => m.href === item.href)
);
