import "server-only";

type AdminPaymentNotificationInput = {
  planName: string;
  amountBdt: number;
  transactionId: string;
  payerNumber: string;
  submittedByEmail: string;
  reviewUrl: string;
};

type UserPaymentNotificationInput = {
  userEmail: string;
  planName: string;
  amountBdt: number;
  transactionId: string;
  status: "approved" | "rejected";
  notes?: string | null;
};

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://intelled.org";
}

async function sendEmail(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM_ADDRESS;

  if (!apiKey || !from || !to) {
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend email request failed: ${errorText}`);
  }

  return true;
}

export async function notifyAdminOfManualPayment(input: AdminPaymentNotificationInput) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  const subject = `New bKash payment request for ${input.planName}`;
  const text = [
    "A new manual bKash payment request was submitted.",
    "",
    `Plan: ${input.planName}`,
    `Amount: ৳${input.amountBdt}`,
    `Transaction ID: ${input.transactionId}`,
    `Payer number: ${input.payerNumber}`,
    `Account email: ${input.submittedByEmail}`,
    "",
    `Review: ${input.reviewUrl}`
  ].join("\n");

  try {
    await sendEmail(adminEmail ?? "", subject, text);
  } catch (error) {
    console.error(error);
  }
}

export async function notifyUserOfManualPaymentReview(input: UserPaymentNotificationInput) {
  const statusLabel = input.status === "approved" ? "approved" : "rejected";
  const subject = `Your intellED payment request was ${statusLabel}`;
  const text = [
    `Your payment request for ${input.planName} was ${statusLabel}.`,
    "",
    `Amount: ৳${input.amountBdt}`,
    `Transaction ID: ${input.transactionId}`,
    input.notes ? `Notes: ${input.notes}` : "",
    "",
    `Open intellED: ${getSiteUrl()}/profile`
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await sendEmail(input.userEmail, subject, text);
  } catch (error) {
    console.error(error);
  }
}
