import { NextResponse, type NextRequest } from "next/server";

const APP_ID = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID!;

function getUnverifiedInstantUser(request: NextRequest) {
  const raw = request.cookies.get(`instant_user_${APP_ID}`)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as {
      id: string;
      email?: string;
      refresh_token: string;
    };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = getUnverifiedInstantUser(request);

  if (pathname.startsWith("/admin/dashboard") && !user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (
    (pathname.startsWith("/checkout") ||
      pathname.startsWith("/orders") ||
      pathname.startsWith("/account")) &&
    !user
  ) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
