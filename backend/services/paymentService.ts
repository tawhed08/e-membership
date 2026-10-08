interface AamarPayCredentials {
  baseUrl: string;
  storeId: string;
  signatureKey: string;
  backendUrl: string;
}

export interface AamarPayCheckoutInput {
  transactionId: string;
  amount: number;
  description: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface AamarPayTransaction {
  result?: string | boolean;
  payment_url?: string;
  tran_id?: string;
  mer_txnid?: string;
  amount?: string | number;
  amount_original?: string | number;
  amount_bdt?: string | number;
  currency?: string;
  currency_merchant?: string;
  status_code?: string | number;
  pay_status?: string;
  store_id?: string;
}

export function isAamarPayConfigured(): boolean {
  return Boolean(
    process.env.AAMARPAY_STORE_ID?.trim() &&
      process.env.AAMARPAY_SIGNATURE_KEY?.trim()
  );
}

function getCredentials(): AamarPayCredentials {
  const storeId = process.env.AAMARPAY_STORE_ID?.trim();
  const signatureKey = process.env.AAMARPAY_SIGNATURE_KEY?.trim();
  const backendUrl = process.env.BACKEND_URL?.trim()?.replace(/\/+$/, "");

  if (!storeId || !signatureKey || !backendUrl) {
    throw new Error(
      "Card checkout is not configured. Set AAMARPAY_STORE_ID, AAMARPAY_SIGNATURE_KEY and BACKEND_URL."
    );
  }

  let callbackOrigin: URL;
  try {
    callbackOrigin = new URL(backendUrl);
  } catch {
    throw new Error("BACKEND_URL must be a valid absolute URL.");
  }

  if (
    process.env.NODE_ENV === "production" &&
    callbackOrigin.protocol !== "https:"
  ) {
    throw new Error("BACKEND_URL must use HTTPS in production.");
  }

  const sandbox = process.env.AAMARPAY_SANDBOX !== "false";

  return {
    baseUrl: sandbox
      ? "https://sandbox.aamarpay.com"
      : "https://secure.aamarpay.com",
    storeId,
    signatureKey,
    backendUrl,
  };
}

async function readGatewayResponse(response: Response): Promise<AamarPayTransaction> {
  if (!response.ok) {
    throw new Error(`aamarPay returned HTTP ${response.status}.`);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("aamarPay returned an invalid response.");
  }

  if (!data || typeof data !== "object") {
    throw new Error("aamarPay returned an invalid response.");
  }
  return data as AamarPayTransaction;
}

export async function initiateAamarPayCheckout(
  input: AamarPayCheckoutInput
): Promise<string> {
  const credentials = getCredentials();
  const frontendUrl = process.env.FRONTEND_URL?.trim();
  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is required for card checkout.");
  }

  let frontendOrigin: URL;
  try {
    frontendOrigin = new URL(frontendUrl);
  } catch {
    throw new Error("FRONTEND_URL must be a valid absolute URL.");
  }
  if (
    process.env.NODE_ENV === "production" &&
    frontendOrigin.protocol !== "https:"
  ) {
    throw new Error("FRONTEND_URL must use HTTPS in production.");
  }

  const callbackUrl = (path: string) =>
    `${credentials.backendUrl}/api/payments/gateway/${path}`;
  const requestBody = {
    store_id: credentials.storeId,
    signature_key: credentials.signatureKey,
    tran_id: input.transactionId,
    amount: input.amount.toFixed(2),
    currency: "BDT",
    desc: input.description,
    cus_name: input.customer.name,
    cus_email: input.customer.email,
    cus_phone: input.customer.phone,
    cus_add1: "Not provided",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    success_url: callbackUrl("success"),
    fail_url: callbackUrl("fail"),
    cancel_url: callbackUrl("cancel"),
    type: "json",
  };

  const response = await fetch(`${credentials.baseUrl}/jsonpost.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await readGatewayResponse(response);

  if (data.result !== true && data.result !== "true") {
    throw new Error("aamarPay could not create a checkout session.");
  }
  if (typeof data.payment_url !== "string") {
    throw new Error("aamarPay did not return a checkout URL.");
  }

  const paymentUrl = new URL(data.payment_url);
  const expectedHost = credentials.baseUrl === "https://sandbox.aamarpay.com"
    ? "sandbox.aamarpay.com"
    : "secure.aamarpay.com";
  if (paymentUrl.protocol !== "https:" || paymentUrl.hostname !== expectedHost) {
    throw new Error("aamarPay returned an unexpected checkout URL.");
  }

  return paymentUrl.toString();
}

export async function verifyAamarPayTransaction(
  transactionId: string
): Promise<AamarPayTransaction> {
  const credentials = getCredentials();
  const verificationUrl = new URL(
    `${credentials.baseUrl}/api/v1/trxcheck/request.php`
  );
  verificationUrl.search = new URLSearchParams({
    request_id: transactionId,
    store_id: credentials.storeId,
    signature_key: credentials.signatureKey,
    type: "json",
  }).toString();

  const response = await fetch(verificationUrl, {
    method: "GET",
    signal: AbortSignal.timeout(15_000),
  });
  return readGatewayResponse(response);
}