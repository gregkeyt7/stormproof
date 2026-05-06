import { decryptSecret } from "@/lib/security/encryption";
import { TradingMode } from "@/lib/types";

export type BrokerOrderRequest = {
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  mode: TradingMode;
};

export type BrokerOrderResponse = {
  accepted: boolean;
  orderId: string;
  message: string;
};

export interface ExchangeGateway {
  submitOrder(order: BrokerOrderRequest): Promise<BrokerOrderResponse>;
}

export class BinanceGateway implements ExchangeGateway {
  constructor(
    private readonly apiKeyCiphertext: string,
    private readonly apiSecretCiphertext: string,
    private readonly sandbox: boolean,
  ) {}

  async submitOrder(order: BrokerOrderRequest): Promise<BrokerOrderResponse> {
    if (order.mode === "paper") {
      return {
        accepted: true,
        orderId: `paper_${Date.now()}`,
        message: "Paper order simulated through Binance gateway adapter.",
      };
    }

    const apiKey = decryptSecret(this.apiKeyCiphertext);
    const apiSecret = decryptSecret(this.apiSecretCiphertext);
    if (!apiKey || !apiSecret) {
      return {
        accepted: false,
        orderId: "",
        message: "Live order blocked because broker credentials are unavailable.",
      };
    }

    // Placeholder integration point: call Binance Testnet/Sandbox or live REST API here.
    return {
      accepted: this.sandbox,
      orderId: `bn_${Date.now()}`,
      message: this.sandbox
        ? "Sandbox order request accepted by adapter."
        : "Live broker call not implemented in this scaffold.",
    };
  }
}

export class OandaGateway implements ExchangeGateway {
  async submitOrder(order: BrokerOrderRequest): Promise<BrokerOrderResponse> {
    return {
      accepted: false,
      orderId: "",
      message: `OANDA integration placeholder for ${order.symbol}.`,
    };
  }
}

export class AlpacaGateway implements ExchangeGateway {
  async submitOrder(order: BrokerOrderRequest): Promise<BrokerOrderResponse> {
    return {
      accepted: false,
      orderId: "",
      message: `Alpaca integration placeholder for ${order.symbol}.`,
    };
  }
}
