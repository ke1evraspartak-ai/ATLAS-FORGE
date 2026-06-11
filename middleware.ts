import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const managerId = request.cookies.get("atlas_manager_id")?.value;
  const adminId = request.cookies.get("atlas_admin_id")?.value;

  const path = request.nextUrl.pathname;

  // Менеджеры
  if (path.startsWith("/manager") && !managerId) {
    return NextResponse.redirect(new URL("/manager-login", request.url));
  }

  // Админка
  if (
    path.startsWith("/admin") &&
    !path.startsWith("/admin-login") &&
    !adminId
  ) {
    return NextResponse.redirect(new URL("/admin-login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/manager/:path*", "/admin/:path*"],
};