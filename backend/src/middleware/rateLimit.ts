import { NextFunction, Request, Response } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";

const authLimiter = new RateLimiterMemory({
  keyPrefix: "auth",
  points: 10,
  duration: 60
});

const apiLimiter = new RateLimiterMemory({
  keyPrefix: "api",
  points: 180,
  duration: 60
});

function getIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim() || req.ip || "unknown";
  }
  return req.ip || "unknown";
}

export function authRateLimit(req: Request, res: Response, next: NextFunction): void {
  authLimiter.consume(getIp(req))
    .then(() => next())
    .catch(() => {
      res.status(429).json({
        error: "Too many authentication attempts. Please wait and retry."
      });
    });
}

export function apiRateLimit(req: Request, res: Response, next: NextFunction): void {
  apiLimiter.consume(getIp(req))
    .then(() => next())
    .catch(() => {
      res.status(429).json({
        error: "Rate limit exceeded. Slow down and retry shortly."
      });
    });
}

export const globalLimiter = apiRateLimit;
