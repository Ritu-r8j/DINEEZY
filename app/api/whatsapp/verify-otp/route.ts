import { NextResponse } from "next/server";
import { verifyOTPFromFirestore } from "@/app/(utils)/firebaseOperations";

export async function POST(request: Request) {
  try {
    const { phoneNumber, otp } = await request.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { success: false, error: "Phone number and OTP are required" },
        { status: 400 }
      );
    }

    // Verify OTP using Firebase operations
    const result = await verifyOTPFromFirestore(phoneNumber, otp);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "OTP verified successfully"
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || "Invalid OTP" },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}
