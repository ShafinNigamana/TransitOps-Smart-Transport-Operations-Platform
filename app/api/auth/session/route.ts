import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("transitops_session");
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const payload = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf8"));
    return NextResponse.json({
      user: {
        id: payload.userId,
        email: payload.email,
        user_metadata: {
          role: payload.userRole,
          full_name: payload.fullName
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ user: null, error: error.message }, { status: 500 });
  }
}
