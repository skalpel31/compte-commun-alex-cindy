import { LayoutDashboard, Receipt, PiggyBank, Scale, Settings } from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Aperçu", icon: LayoutDashboard },
  { href: "/transactions", label: "Mouvements", icon: Receipt },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/settle", label: "Règlement", icon: Scale },
  { href: "/settings", label: "Réglages", icon: Settings },
] as const;
