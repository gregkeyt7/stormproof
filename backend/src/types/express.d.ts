import type { JwtPayloadShape } from "../lib/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayloadShape;
      correlationId?: string;
    }
  }
}

export {};
