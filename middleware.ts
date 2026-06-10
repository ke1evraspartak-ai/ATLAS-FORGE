import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const managerId = request.cookies.get("atlas_manager_id")?.value;

  if (request.nextUrl.pathname.startsWith("/manager") && !managerId) {
    return NextResponse.redirect(new URL("/manager-login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/manager/:path*"],
};