import { LayoutDashboard, Receipt, PiggyBank, FileText, Scale, Settings } from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Aperçu", icon: LayoutDashboard },
  { href: "/transactions", label: "Mouvements", icon: Receipt },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/bills", label: "Factures", icon: FileText },
  { href: "/settle", label: "Règlement", icon: Scale },
  { href: "/settings", label: "Réglages", icon: Settings },
] as const;
