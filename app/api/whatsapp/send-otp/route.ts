import { NextResponse } from "next/server";

const API_BASE_URL = process.env.WHATSAPP_API_BASE_URL || "https://api.webifyit.in/api/v1/dev";
const API_KEY = process.env.WHATSAPP_API_KEY || "dev_3a0b6f51d8b1";

export async function POST(request: Request) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { status: false, message: "phoneNumber and message are required" },
        { status: 400 }
      );
    }

    const formattedPhone = String(phoneNumber).startsWith("+")
      ? String(phoneNumber).slice(1)
      : String(phoneNumber);

    const targetUrl = `${API_BASE_URL}/create-message?apikey=${API_KEY}&to=${formattedPhone}&message=${encodeURIComponent(
      message
    )}`;

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        {
          status: false,
          message: `Failed to hit WhatsApp API (${response.status})`,
          details: text,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("WhatsApp send-otp route error", error);
    return NextResponse.json(
      {
        status: false,
        message: error instanceof Error ? error.message : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}
