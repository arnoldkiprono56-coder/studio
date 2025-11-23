// /src/app/api/ip/route.ts
import { NextResponse } from 'next/server';

// This function handles GET requests to /api/ip
export async function GET(request: Request) {
  try {
    // Get the user's IP address from the request headers.
    // 'x-forwarded-for' is a standard header for identifying the originating IP address of a client.
    // We fall back to other headers or '127.0.0.1' if it's not present.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    // In a local development environment, the IP will be a local address.
    // We'll simulate a Kenyan IP for testing purposes.
    const isDevelopment = process.env.NODE_ENV === 'development';
    const finalIp = isDevelopment ? '197.232.81.169' : ip;

    // Call the external IP intelligence service.
    // The 'fields' parameter specifies exactly what data we want back.
    const response = await fetch(`http://ip-api.com/json/${finalIp}?fields=status,message,countryCode,proxy`);
    const data = await response.json();

    if (data.status === 'fail') {
      console.error('IP API call failed:', data.message);
      // If the API fails, we'll default to allowing access to avoid blocking legitimate users.
      return NextResponse.json({
        isBlocked: false,
        reason: null,
      });
    }

    // Determine if the user should be blocked.
    const isOutsideKenya = data.countryCode !== 'KE';
    const isVpnOrProxy = data.proxy === true;
    const shouldBlock = isOutsideKenya || isVpnOrProxy;

    let reason: 'country' | 'vpn' | null = null;
    if (isOutsideKenya) {
      reason = 'country';
    } else if (isVpnOrProxy) {
      reason = 'vpn';
    }

    return NextResponse.json({
      isBlocked: shouldBlock,
      reason: reason,
    });

  } catch (error) {
    console.error('Error in IP check API:', error);
    // In case of any unexpected errors, we default to not blocking access.
    return NextResponse.json({
      isBlocked: false,
      reason: null,
    }, { status: 500 });
  }
}
