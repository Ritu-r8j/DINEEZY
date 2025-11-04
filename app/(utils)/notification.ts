"use server";

type NotificationType =
  | "ORDER_CONFIRMED"
  | "ORDER_ACCEPTED"
  | "ORDER_PREPARING"
  | "ORDER_READY"
  | "PAYMENT_SUCCESS"
  | "ORDER_CANCELED"
  | "FEEDBACK_REQUEST"
  | "WELCOME_LOGIN"
  | "PHONE_VERIFICATION_OTP"
  | "RESERVATION_CONFIRMED"
  | "RESERVATION_ACCEPTED"
  | "RESERVATION_REJECTED";

interface TemplateConfig {
  template: string;
  message: (data: any) => string;
}

const TEMPLATES: Record<NotificationType, TemplateConfig> = {
  WELCOME_LOGIN: {
    template: "welcome_login",
    message: (data) =>
      `👋 *Welcome to Dineezy*, ${data.name}!\n\nWe’re happy to have you on board 🍽️\n\nWith Dineezy, you can:\n✨ Scan the QR on your table to order instantly\n⚡ Track your order live\n💸 Pay securely online\n🎉 Enjoy exclusive offers and rewards\n\nStart your smart dining experience today!\nVisit: https://dineezy.in\n\n— Team *Dineezy* 💚`,
  },

  ORDER_CONFIRMED: {
    template: "order_confirmed",
    message: (data) =>
      `🍽️ *Dineezy Order Confirmed!*\n\nHi ${data.name}, your order *#${data.orderId}* at *${data.restaurant}* has been received successfully.\n🕐 Estimated Preparation Time: ${data.time} mins\n\nOnce restaurant confirms your order, We'll notify you.\n\nThank you for ordering with Dineezy! 💚`,
  },
  ORDER_ACCEPTED: {
    template: "order_accepted",
    message: (data) =>
      `✅ *Great news, ${data.name}!*\n\nYour order *#${data.orderId}* has been accepted by *${data.restaurant}*.\n🕐 Estimated Time: ${data.time} minutes\n\nWe'll start preparing your food shortly!`,
  },

  ORDER_PREPARING: {
    template: "order_preparing",
    message: (data) =>
      `👨‍🍳 *Cooking in Progress!*\n\nHi ${data.name}, our chef has started preparing your order *#${data.orderId}*.\n🔥 Your delicious meal will be ready soon!\n\nEstimated time: ${data.time} minutes`,
  },

  ORDER_READY: {
    template: "order_ready",
    message: (data) =>
      `🔥 *Order Ready!*\n\nHi ${data.name}, your order *#${data.orderId}* is ready.\nPlease collect it from the counter or our waiter will serve it shortly. 🍱`,
  },

  PAYMENT_SUCCESS: {
    template: "payment_success",
    message: (data) =>
      `💳 *Payment Successful!*\n\nWe’ve received ₹${data.amount} for your order *#${data.orderId}*.\nThank you for dining with us, ${data.name}! 😊\nHope you enjoy your meal 🍔`,
  },

  ORDER_CANCELED: {
    template: "order_canceled",
    message: (data) =>
      `⚠️ *Order Canceled*\n\nHi ${data.name}, your order *#${data.orderId}* has been canceled.\nReason: ${data.reason || "Not specified"}\n\nIf payment was made, it will be refunded shortly. 🙏`,
  },

  FEEDBACK_REQUEST: {
    template: "feedback_request",
    message: (data) =>
      `⭐ *We'd love your feedback!*\n\nHi ${data.name}, how was your experience with Dineezy today?\nPlease rate your meal:\n👍 Great | 😐 Okay | 👎 Needs Improvement\n\nYour feedback helps us serve you better. 💬`,
  },

  PHONE_VERIFICATION_OTP: {
    template: "phone_verification_otp",
    message: (data) =>
      `🔐 *Phone Verification*\n\nHi ${data.name}, your verification code for Dineezy is:\n\n*${data.otp}*\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this verification, please ignore this message.\n\n— Team *Dineezy* 💚`,
  },

  RESERVATION_CONFIRMED: {
    template: "reservation_confirmed",
    message: (data) =>
      `📋 *Reservation Request Submitted*\n\nHi ${data.name}, your table reservation request at *${data.restaurant}* has been submitted successfully.\n\n📅 Date: ${data.date}\n🕐 Time: ${data.time}\n👥 Guests: ${data.guests}\n🆔 Reservation ID: *${data.reservationId}*\n\n${data.specialRequests ? `📝 Special Requests: ${data.specialRequests}\n\n` : ""}⏳ *Status: Pending Restaurant Confirmation*\n\nWe'll notify you once the restaurant confirms your reservation. This usually takes a few minutes.\n\nThank you for choosing Dineezy! 💚`,
  },

  RESERVATION_ACCEPTED: {
    template: "reservation_accepted",
    message: (data) =>
      `✅ *Reservation Confirmed!*\n\nGreat news ${data.name}! Your table reservation at *${data.restaurant}* has been confirmed by the restaurant.\n\n📅 Date: ${data.date}\n🕐 Time: ${data.time}\n👥 Guests: ${data.guests}\n🆔 Reservation ID: *${data.reservationId}*\n\n${data.specialRequests ? `📝 Special Requests: ${data.specialRequests}\n\n` : ""}🎉 Your table is reserved! Please arrive on time.\n\nIf you need to cancel or modify, please contact the restaurant directly.\n\nSee you soon! 💚`,
  },

  RESERVATION_REJECTED: {
    template: "reservation_rejected",
    message: (data) =>
      `❌ *Reservation Update*\n\nHi ${data.name}, unfortunately your table reservation at *${data.restaurant}* could not be confirmed.\n\n📅 Date: ${data.date}\n🕐 Time: ${data.time}\n👥 Guests: ${data.guests}\n🆔 Reservation ID: *${data.reservationId}*\n\n${data.reason ? `📝 Reason: ${data.reason}\n\n` : ""}We apologize for the inconvenience. Please try booking for a different time or contact the restaurant directly.\n\nThank you for understanding! 💚`,
  },
};

// Helper function
function formatPhoneNumber(phoneNumber: string): string {
  const phone = phoneNumber.trim();
  if (phone.length === 10) return `91${phone}`;
  if (phone.startsWith("91") && phone.length === 12) return phone;
  throw new Error("Invalid phone number format.");
}

// 🚀 SERVER ACTION FUNCTION
export async function sendNotification(
  type: NotificationType,
  to: string,
  data: any
): Promise<any> {
  const template = TEMPLATES[type];
  if (!template) throw new Error(`Invalid notification type: ${type}`);

  const message = template.message(data);
  const formattedPhone = formatPhoneNumber(to);
  const encodedMessage = encodeURIComponent(message);

  console.log(formattedPhone, "\n", message);

  const response = await fetch(
    `https://api.webifyit.in/api/v1/dev/create-message?apikey=${process.env.NEXT_PUBLIC_WP_API_KEY}&to=${formattedPhone}&message=${encodedMessage}`
  );

  const result = await response.json();

  console.log(result);
  console.log(`✅ WhatsApp message sent to ${formattedPhone} (${type})`);

  return result;
}

// Helper for reservation updates
export async function sendReservationStatusUpdate(
  reservationId: string,
  customerPhone: string,
  customerName: string,
  restaurantName: string,
  reservationDetails: {
    date: string;
    time: string;
    guests: number;
    specialRequests?: string;
  },
  status: "accepted" | "rejected",
  reason?: string
): Promise<any> {
  const notificationType =
    status === "accepted" ? "RESERVATION_ACCEPTED" : "RESERVATION_REJECTED";

  const notificationData = {
    name: customerName,
    restaurant: restaurantName,
    date: reservationDetails.date,
    time: reservationDetails.time,
    guests: reservationDetails.guests,
    reservationId,
    specialRequests: reservationDetails.specialRequests,
    reason,
  };

  return await sendNotification(notificationType, customerPhone, notificationData);
}
