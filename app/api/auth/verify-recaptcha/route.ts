import { NextResponse } from "next/server";

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    console.error("RECAPTCHA_SECRET_KEY is not set");
    return false;
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const { recaptchaToken } = await req.json();

    if (!recaptchaToken) {
      return new NextResponse("reCAPTCHA token is required", { status: 400 });
    }

    // Verify reCAPTCHA token
    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      return new NextResponse("reCAPTCHA verification failed", { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[VERIFY_RECAPTCHA]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

