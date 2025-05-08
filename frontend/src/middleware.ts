import { NextResponse, NextRequest } from "next/server";

// This middleware simply logs requests and doesn't interfere with navigation
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log("Middleware processing:", path);

  // Just let all requests pass through
  return NextResponse.next();
}

// Don't run middleware on any paths for now
export const config = {
  matcher: [],
};
