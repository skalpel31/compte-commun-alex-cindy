// Modules hors-finances : visibles dans le menu mais verrouillés, en
// attendant d'être proposés comme options payantes. Pour en débloquer un,
// le retirer de cette liste. Fichier sans dépendance pour pouvoir être
// importé depuis le proxy.
export const LOCKED_MODULE_HREFS = [
  "/sante",
  "/nutrition",
  "/courses",
  "/course-a-pied",
  "/calisthenics",
] as const;

export function isLockedPath(pathname: string): boolean {
  return LOCKED_MODULE_HREFS.some(
    (href) => pathname === href || pathname.startsWith(`${href}/`)
  );
}
