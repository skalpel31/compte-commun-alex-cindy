import { LayoutDashboard, Receipt, PiggyBank, FileText, HandCoins, Settings } from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/transactions", label: "Dépenses", icon: Receipt },
  { href: "/budgets", label: "Budgets & Enveloppes", icon: PiggyBank },
  { href: "/bills", label: "Factures", icon: FileText },
  { href: "/settle", label: "Contributions", icon: HandCoins },
  { href: "/settings", label: "Paramètres", icon: Settings },
] as const;
