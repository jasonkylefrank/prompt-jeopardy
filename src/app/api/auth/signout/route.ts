import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
    const host = headers().get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    // In a real app using Admin SDK, you would revoke the session cookie here.
    // For this client-side only example, we just redirect. The client's auth state
    // will be cleared by the onAuthStateChanged listener seeing no user.
    const response = NextResponse.redirect(`${protocol}://${host}`, { status: 302 });

    // When using session cookies, you would clear it here
    // response.cookies.set('session', '', { maxAge: -1 });

    return response;
}
