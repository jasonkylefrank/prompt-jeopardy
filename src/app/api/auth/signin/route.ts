import { auth } from 'firebase-admin';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const host = headers().get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const redirectUrl = await auth().createLoginUrl({
        provider: 'google.com',
        continueUrl: `${protocol}://${host}`
    });

    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (error) {
    console.error('Error creating login URL:', error);
    const host = headers().get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    // Redirect home with an error parameter if something goes wrong
    return NextResponse.redirect(`${protocol}://${host}/?error=auth_failed`, { status: 302 });
  }
}
