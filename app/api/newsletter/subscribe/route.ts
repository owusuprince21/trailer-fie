// app/api/newsletter/subscribe/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if already subscribed
    const checkRes = await fetch(
      `${process.env.MAILERLITE_BASE_URL}/subscribers/${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MAILERLITE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (checkRes.ok) {
      return NextResponse.json(
        { error: 'You have already subscribed' },
        { status: 409 }
      );
    }

    // If not found → create subscription
    const res = await fetch(`${process.env.MAILERLITE_BASE_URL}/subscribers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MAILERLITE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        groups: [process.env.MAILERLITE_GROUP_ID],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.message || 'Failed to subscribe' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Newsletter subscribe error', e);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
