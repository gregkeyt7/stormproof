import jwt from "jsonwebtoken";
import { env } from "../config";

export type AuthPayload = {
  userId: string;
  email?: string;
  role: "USER" | "ADMIN";
};

export function signToken(payload: AuthPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, env.jwtSecret) as AuthPayload;
}

export const signAccessToken = signToken;

export function verifyAccessToken(token: string): AuthPayload & { sub: string } {
  const payload = verifyToken(token);
  return { ...payload, sub: payload.userId };
}
