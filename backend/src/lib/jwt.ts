import jwt from "jsonwebtoken";
import { env } from "../config";

export type AuthPayload = {
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
};

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
}
