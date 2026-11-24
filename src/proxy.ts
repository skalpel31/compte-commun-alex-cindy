import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isLockedPath } from "@/lib/modules";

export async function proxy(request: NextRequest) {
  // Modules verrouillés (voir src/lib/modules.ts) : renvoi vers l'accueil.
  if (isLockedPath(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/).*)"],
};
