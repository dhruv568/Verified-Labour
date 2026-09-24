declare module '@cashfreepayments/cashfree-js' {
  export interface CashfreeInitOptions {
    mode: 'sandbox' | 'production';
  }

  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: '_modal' | '_self' | '_blank' | HTMLElement;
  }

  export interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<{
      error?: {
        message: string;
        code?: string;
      };
      redirect?: boolean;
      paymentDetails?: any;
    }>;
  }

  export function load(options: CashfreeInitOptions): Promise<CashfreeInstance>;
}
