import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5050),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(24, "JWT_SECRET must be at least 24 chars"),
  JWT_EXPIRES_IN: z.string().default("12h"),
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, "ENCRYPTION_KEY must be a 64-char hex key"),
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(20),
  UPLOAD_DIR: z.string().default("./uploads"),
  CLIENT_ORIGIN: z.string().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const message = parsed.error.issues.map((issue) => issue.message).join("; ");
  throw new Error(`Invalid environment configuration: ${message}`);
}

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  jwtSecret: parsed.data.JWT_SECRET,
  jwtExpiresIn: parsed.data.JWT_EXPIRES_IN,
  storageEncryptionKey: parsed.data.ENCRYPTION_KEY,
  openAiApiKey: parsed.data.OPENAI_API_KEY,
  openAiModel: parsed.data.OPENAI_MODEL,
  maxUploadMb: parsed.data.MAX_UPLOAD_MB,
  uploadDir: parsed.data.UPLOAD_DIR,
  corsOrigin: parsed.data.CLIENT_ORIGIN,
};

export const config = env;

