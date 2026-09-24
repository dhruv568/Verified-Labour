import crypto from 'crypto';

export interface CashfreeCustomerDetails {
  id: string;
  name: string;
  email?: string;
  phone: string;
}

export interface CashfreeCreateOrderParams {
  jobId: string;
  amount: number; // in INR rupees (e.g. 350.00)
  currency?: string; // defaults to 'INR'
  customer: CashfreeCustomerDetails;
  returnUrl?: string;
  notifyUrl?: string;
  orderNote?: string;
  customOrderId?: string;
}

export interface CashfreeOrderResult {
  success: boolean;
  orderId: string;
  cfOrderId?: string | number;
  paymentSessionId?: string;
  orderStatus?: string;
  amount: number;
  currency: string;
  environment: 'SANDBOX' | 'PRODUCTION';
  message?: string;
}

export interface CashfreePaymentItem {
  cfPaymentId: string | number;
  paymentStatus: 'SUCCESS' | 'FAILED' | 'PENDING' | 'USER_DROPPED' | string;
  paymentAmount: number;
  paymentCurrency: string;
  paymentMethod?: any;
  paymentTime?: string;
  paymentMessage?: string;
}

export interface CashfreeVerificationResult {
  verified: boolean;
  orderStatus: string;
  paymentStatus?: string;
  cfPaymentId?: string;
  paymentAmount?: number;
  paymentMethod?: string;
  paymentTime?: string;
  message?: string;
}

export class CashfreePaymentService {
  private appId: string;
  private secretKey: string;
  private webhookSecret: string;
  private environment: 'SANDBOX' | 'PRODUCTION';
  private apiVersion: string = '2023-08-01';

  constructor() {
    this.appId =
      process.env.CASHFREE_PAYMENT_APP_ID ||
      process.env.CASHFREE_APP_ID ||
      'cf_sandbox_placeholder_app_id';
    this.secretKey =
      process.env.CASHFREE_PAYMENT_SECRET_KEY ||
      process.env.CASHFREE_SECRET_KEY ||
      'cf_sandbox_placeholder_secret_key';
    this.webhookSecret =
      process.env.CASHFREE_PAYMENT_WEBHOOK_SECRET ||
      this.secretKey;

    const env = (
      process.env.CASHFREE_PAYMENT_ENVIRONMENT ||
      process.env.CASHFREE_ENVIRONMENT ||
      'SANDBOX'
    ).toUpperCase();

    this.environment = env === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';
  }

  public getBaseUrl(): string {
    return this.environment === 'PRODUCTION'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';
  }

  public getEnvironment(): 'SANDBOX' | 'PRODUCTION' {
    return this.environment;
  }

  public isMockMode(): boolean {
    return (
      !this.appId ||
      !this.secretKey ||
      this.appId.startsWith('TEST_CF') ||
      this.appId.toLowerCase().includes('placeholder') ||
      this.secretKey.toLowerCase().includes('placeholder') ||
      process.env.NODE_ENV === 'test'
    );
  }

  private cleanPhone(phone: string): string {
    const cleaned = (phone || '').replace(/[^0-9]/g, '');
    if (cleaned.length >= 10) {
      return cleaned.slice(-10);
    }
    return '9999999999';
  }

  private cleanCustomerId(id: string): string {
    const cleaned = (id || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (cleaned.length >= 3) {
      return cleaned.slice(0, 45);
    }
    return `cust_${Date.now()}`;
  }

  /**
   * Creates a Cashfree Payment Order (PG API v2023-08-01)
   */
  async createOrder(params: CashfreeCreateOrderParams): Promise<CashfreeOrderResult> {
    const {
      jobId,
      amount,
      currency = 'INR',
      customer,
      returnUrl,
      notifyUrl,
      orderNote,
      customOrderId,
    } = params;

    // Generate unique order ID if not specified
    const orderId =
      customOrderId ||
      `vl_ord_${jobId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}_${Date.now()}`.slice(0, 45);

    const roundedAmount = Math.round(amount * 100) / 100;

    if (this.isMockMode()) {
      const mockSessionId = `session_mock_cf_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      return {
        success: true,
        orderId,
        cfOrderId: `cf_${Date.now()}`,
        paymentSessionId: mockSessionId,
        orderStatus: 'ACTIVE',
        amount: roundedAmount,
        currency,
        environment: this.environment,
        message: 'Mock Cashfree order generated for local development / testing',
      };
    }

    try {
      const customerId = this.cleanCustomerId(customer.id);
      const customerPhone = this.cleanPhone(customer.phone);
      const customerEmail =
        customer.email && customer.email.includes('@')
          ? customer.email
          : `${customerId}@customer.verifiedlabour.com`;

      const requestBody: any = {
        order_id: orderId,
        order_amount: roundedAmount,
        order_currency: currency,
        customer_details: {
          customer_id: customerId,
          customer_name: customer.name || 'Verified Labour Customer',
          customer_email: customerEmail,
          customer_phone: customerPhone,
        },
        order_note: orderNote || `Payment for booking #${jobId}`,
      };

      const meta: any = {};
      if (returnUrl) meta.return_url = returnUrl;
      if (notifyUrl) meta.notify_url = notifyUrl;
      if (Object.keys(meta).length > 0) {
        requestBody.order_meta = meta;
      }

      const response = await fetch(`${this.getBaseUrl()}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.appId,
          'x-client-secret': this.secretKey,
          'x-api-version': this.apiVersion,
          'x-request-id': `req_vl_${Date.now()}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && (data.payment_session_id || data.order_status)) {
        return {
          success: true,
          orderId: data.order_id || orderId,
          cfOrderId: data.cf_order_id,
          paymentSessionId: data.payment_session_id,
          orderStatus: data.order_status,
          amount: data.order_amount || roundedAmount,
          currency: data.order_currency || currency,
          environment: this.environment,
        };
      }

      return {
        success: false,
        orderId,
        amount: roundedAmount,
        currency,
        environment: this.environment,
        message:
          data.message || data.error?.message || 'Could not create payment order with Cashfree',
      };
    } catch (err: any) {
      return {
        success: false,
        orderId,
        amount: roundedAmount,
        currency,
        environment: this.environment,
        message: 'Cashfree gateway connection error: ' + err.message,
      };
    }
  }

  /**
   * Fetches order details directly from Cashfree PG server
   */
  async getOrder(orderId: string): Promise<any> {
    if (this.isMockMode()) {
      return {
        order_id: orderId,
        order_status: 'PAID',
        order_amount: 350.0,
        order_currency: 'INR',
      };
    }

    const response = await fetch(`${this.getBaseUrl()}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': this.appId,
        'x-client-secret': this.secretKey,
        'x-api-version': this.apiVersion,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Cashfree order status: HTTP ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Fetches payment attempts for a given order
   */
  async getOrderPayments(orderId: string): Promise<CashfreePaymentItem[]> {
    if (this.isMockMode()) {
      return [
        {
          cfPaymentId: `cf_pay_sim_${Date.now()}`,
          paymentStatus: 'SUCCESS',
          paymentAmount: 350.0,
          paymentCurrency: 'INR',
          paymentMessage: 'Simulated payment successful',
          paymentTime: new Date().toISOString(),
          paymentMethod: { upi: { channel: 'collect' } },
        },
      ];
    }

    const response = await fetch(`${this.getBaseUrl()}/orders/${orderId}/payments`, {
      method: 'GET',
      headers: {
        'x-client-id': this.appId,
        'x-client-secret': this.secretKey,
        'x-api-version': this.apiVersion,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Cashfree payments for order: HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      cfPaymentId: item.cf_payment_id,
      paymentStatus: item.payment_status,
      paymentAmount: item.payment_amount,
      paymentCurrency: item.payment_currency,
      paymentMethod: item.payment_method,
      paymentTime: item.payment_time,
      paymentMessage: item.payment_message,
    }));
  }

  /**
   * Verifies payment server-side with Cashfree
   */
  async verifyPayment(orderId: string): Promise<CashfreeVerificationResult> {
    if (this.isMockMode()) {
      return {
        verified: true,
        orderStatus: 'PAID',
        paymentStatus: 'SUCCESS',
        cfPaymentId: `cf_pay_mock_${Date.now()}`,
        paymentAmount: 350.0,
        paymentMethod: 'UPI',
        paymentTime: new Date().toISOString(),
        message: 'Mock payment verified successfully',
      };
    }

    try {
      const order = await this.getOrder(orderId);
      const payments = await this.getOrderPayments(orderId);

      const successfulPayment = payments.find((p) => p.paymentStatus === 'SUCCESS');

      if (order.order_status === 'PAID' || successfulPayment) {
        let methodStr = 'ONLINE';
        if (successfulPayment?.paymentMethod) {
          const keys = Object.keys(successfulPayment.paymentMethod);
          if (keys.length > 0) methodStr = keys[0].toUpperCase();
        }

        return {
          verified: true,
          orderStatus: order.order_status || 'PAID',
          paymentStatus: 'SUCCESS',
          cfPaymentId: successfulPayment ? String(successfulPayment.cfPaymentId) : undefined,
          paymentAmount: successfulPayment?.paymentAmount || order.order_amount,
          paymentMethod: methodStr,
          paymentTime: successfulPayment?.paymentTime || new Date().toISOString(),
          message: 'Payment verified successfully on Cashfree servers',
        };
      }

      const pendingPayment = payments.find((p) => p.paymentStatus === 'PENDING');
      if (pendingPayment || order.order_status === 'ACTIVE') {
        return {
          verified: false,
          orderStatus: order.order_status,
          paymentStatus: 'PENDING',
          message: 'Payment is currently pending or processing with the bank.',
        };
      }

      return {
        verified: false,
        orderStatus: order.order_status,
        paymentStatus: payments[0]?.paymentStatus || 'FAILED',
        message: 'No successful payment recorded on Cashfree for this order.',
      };
    } catch (err: any) {
      return {
        verified: false,
        orderStatus: 'ERROR',
        message: `Cashfree server verification error: ${err.message}`,
      };
    }
  }

  /**
   * Cryptographically verifies Cashfree Webhook signatures
   *
   * Cashfree PG Webhook verification:
   * signature = Base64( HMAC-SHA256( timestamp + rawBody, secretKey ) )
   * or Base64( HMAC-SHA256( rawBody, secretKey ) ) if timestamp is omitted
   */
  verifyWebhookSignature(rawBody: string, signature: string, timestamp?: string): boolean {
    if (!signature || !rawBody) return false;

    // In mock mode, allow mock signature for test suites
    if (this.isMockMode() && signature.startsWith('mock_cf_sig_')) {
      return true;
    }

    try {
      const secret = this.webhookSecret;

      // 1. Try with timestamp (Cashfree standard v2023-08-01)
      if (timestamp) {
        const payloadWithTimestamp = timestamp + rawBody;
        const expectedSig1 = crypto
          .createHmac('sha256', secret)
          .update(payloadWithTimestamp)
          .digest('base64');

        if (this.safeStringCompare(signature, expectedSig1)) {
          return true;
        }
      }

      // 2. Try rawBody alone
      const expectedSig2 = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('base64');

      if (this.safeStringCompare(signature, expectedSig2)) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  private safeStringCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
      return false;
    }
  }
}

export const cashfreePaymentService = new CashfreePaymentService();
export default cashfreePaymentService;
