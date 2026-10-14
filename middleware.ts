import { NextResponse, type NextRequest } from "next/server";
import {
  UNLOCK_COOKIE,
  signUnlock,
  unlockCookieOptions,
  verifyUnlock,
} from "@/lib/auth/unlock";
import {
  CHILD_COOKIE,
  childLoginHref,
  isChildId,
  verifyChildSession,
} from "@/lib/auth/child-session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/middleware";

// Tanpa Supabase (mode demo) tidak ada yang dijaga.
const configured = isSupabaseConfigured;

export async function middleware(request: NextRequest) {
  if (!configured()) return NextResponse.next();

  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;
  const redirectTo = (path: string, params: Record<string, string> = {}) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = new URLSearchParams(params).toString();
    const redirect = NextResponse.redirect(url);
    const refreshed = response();
    refreshed.cookies
      .getAll()
      .forEach((cookie) => redirect.cookies.set(cookie));
    redirect.headers.set("cache-control", "private, no-store");
    return redirect;
  };

  // Sudah login: tidak perlu melihat halaman masuk/daftar lagi.
  if (user && (pathname === "/login" || pathname === "/daftar")) {
    return redirectTo(
      (await verifyUnlock(request.cookies.get(UNLOCK_COOKIE)?.value, user.id))
        ? "/dashboard"
        : "/masuk-anak",
    );
  }

  const childId = /^\/(?:child|screening)\/([^/]+)/.exec(pathname)?.[1];
  if (childId && isChildId(childId)) {
    if (!user)
      return redirectTo("/login", {
        next: childLoginHref(childId, pathname + search),
      });
    if (
      !(await verifyChildSession(
        request.cookies.get(CHILD_COOKIE)?.value,
        user.id,
        childId,
      ))
    ) {
      return redirectTo("/masuk-anak", {
        child: childId,
        next: pathname + search,
      });
    }
  }

  if (pathname.startsWith("/dashboard")) {
    if (!user) return redirectTo("/login", { next: pathname + search });

    // Dasbor butuh bukti kedua selain sesi: cookie buka-kunci (lihat lib/auth/unlock.ts).
    const token = request.cookies.get(UNLOCK_COOKIE)?.value;
    if (!(await verifyUnlock(token, user.id)))
      return redirectTo("/unlock", { next: pathname + search });

    // Masa berlaku diperpanjang selama orang tua aktif.
    const res = response();
    const fresh = await signUnlock(user.id);
    if (fresh) res.cookies.set(UNLOCK_COOKIE, fresh, unlockCookieOptions());
    return res;
  }

  return response();
}

export const config = {
  // Semua jalur kecuali berkas statis dan gambar.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
