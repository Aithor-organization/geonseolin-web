// Toss Payments 클라이언트 (시뮬레이션 모드)
// 실제 연동 시 @tosspayments/payment-widget-sdk 설치 후 교체

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY ?? "test_sk_placeholder";
const TOSS_API_URL = "https://api.tosspayments.com/v1";

function getAuthHeader() {
  return `Basic ${Buffer.from(TOSS_SECRET_KEY + ":").toString("base64")}`;
}

export interface TossPaymentResult {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string;
  approvedAt: string;
}

export async function confirmPayment(paymentKey: string, orderId: string, amount: number): Promise<TossPaymentResult> {
  // 시뮬레이션 모드: 실제 API 키가 없으면 모의 응답
  if (TOSS_SECRET_KEY === "test_sk_placeholder") {
    return {
      paymentKey,
      orderId,
      status: "DONE",
      totalAmount: amount,
      method: "카드",
      approvedAt: new Date().toISOString(),
    };
  }

  const res = await fetch(`${TOSS_API_URL}/payments/confirm`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? "결제 승인 실패");
  }

  return res.json();
}

export async function cancelPayment(paymentKey: string, reason: string) {
  if (TOSS_SECRET_KEY === "test_sk_placeholder") {
    return { status: "CANCELED", cancelReason: reason };
  }

  const res = await fetch(`${TOSS_API_URL}/payments/${paymentKey}/cancel`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cancelReason: reason }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? "결제 취소 실패");
  }

  return res.json();
}

export async function getPayment(paymentKey: string) {
  if (TOSS_SECRET_KEY === "test_sk_placeholder") {
    return { paymentKey, status: "DONE", totalAmount: 0 };
  }

  const res = await fetch(`${TOSS_API_URL}/payments/${paymentKey}`, {
    headers: { Authorization: getAuthHeader() },
  });

  if (!res.ok) throw new Error("결제 조회 실패");
  return res.json();
}

// 웹훅 서명 검증
export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (TOSS_SECRET_KEY === "test_sk_placeholder") return true;

  const crypto = require("crypto");
  const expected = crypto
    .createHmac("sha256", TOSS_SECRET_KEY)
    .update(body)
    .digest("base64");

  return expected === signature;
}
