import crypto from 'crypto';

export interface RazorpayOrderParams {
  jobId: string;
  amount: number; // in INR rupees
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  success: boolean;
  orderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
  message?: string;
}

export interface SignatureVerifyParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export class RazorpayPaymentService {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholderKey123';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholderKeySecret456';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_placeholder789';
  }

  private isMockMode(): boolean {
    return (
      !this.keyId ||
      !this.keySecret ||
      this.keyId.includes('placeholder') ||
      process.env.NODE_ENV === 'test'
    );
  }

  /**
   * Creates a Razorpay Order
   * Amount in Rupees is converted to Paise (1 INR = 100 paise)
   */
  async createOrder(params: RazorpayOrderParams): Promise<RazorpayOrderResult> {
    const { jobId, amount, currency = 'INR', notes = {} } = params;
    const amountInPaise = Math.round(amount * 100);

    if (this.isMockMode()) {
      const mockOrderId = `order_vl_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      return {
        success: true,
        orderId: mockOrderId,
        amount: amountInPaise,
        currency,
        keyId: this.keyId,
        message: 'Mock Razorpay order created for development',
      };
    }

    try {
      const authHeader = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt: `rcpt_job_${jobId.slice(0, 8)}`,
          notes: {
            jobId,
            ...notes,
          },
        }),
      });

      const data = await response.json();
      if (response.ok && data.id) {
        return {
          success: true,
          orderId: data.id,
          amount: data.amount,
          currency: data.currency,
          keyId: this.keyId,
        };
      }

      return {
        success: false,
        orderId: '',
        amount: amountInPaise,
        currency,
        keyId: this.keyId,
        message: data.error?.description || 'Could not create payment order with Razorpay',
      };
    } catch (err: any) {
      return {
        success: false,
        orderId: '',
        amount: amountInPaise,
        currency,
        keyId: this.keyId,
        message: 'Razorpay gateway error: ' + err.message,
      };
    }
  }

  /**
   * Cryptographically verifies Razorpay payment signature
   * signature = HMAC-SHA256(order_id + "|" + razorpay_payment_id, secret)
   */
  verifyPaymentSignature(params: SignatureVerifyParams): boolean {
    const { orderId, paymentId, signature } = params;

    if (!orderId || !paymentId || !signature) return false;

    // For mock development testing
    if (this.isMockMode() && signature.startsWith('mock_sig_')) {
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Verifies incoming webhook signatures from Razorpay
   */
  verifyWebhookSignature(rawBody: string, webhookSignature: string): boolean {
    if (!webhookSignature || !rawBody) return false;

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    return expectedSignature === webhookSignature;
  }
}

export const razorpayService = new RazorpayPaymentService();
export default razorpayService;
