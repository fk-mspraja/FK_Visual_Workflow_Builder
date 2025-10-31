import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  // TEMPORARY: Allow all access for demo - REMOVE AFTER FIXING AUTH
  return NextResponse.next()

  /* ORIGINAL AUTH CODE - RESTORE AFTER DEMO
  const isLoggedIn = !!req.auth
  const isOnLoginPage = req.nextUrl.pathname === '/login'
  const pathname = req.nextUrl.pathname

  // Allow access to login page, API routes, and static files
  if (
    isOnLoginPage ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') // Allow files with extensions (images, fonts, etc.)
  ) {
    return NextResponse.next()
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  // Allow access to protected routes if authenticated
  return NextResponse.next()
  */
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
