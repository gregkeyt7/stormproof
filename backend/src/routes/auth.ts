import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { requireAuth } from "../middleware/auth";
import { HttpError } from "../utils/httpError";
import { writeAuditLog } from "../lib/audit";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/register", async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      throw new HttpError(409, "User with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash,
      },
    });

    const token = signToken({ userId: user.id, role: user.role });
    await writeAuditLog({
      userId: user.id,
      action: "AUTH_REGISTER",
      meta: { email: user.email },
      ipAddress: req.ip,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      throw new HttpError(401, "Invalid credentials.");
    }

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isValid) {
      throw new HttpError(401, "Invalid credentials.");
    }

    const token = signToken({ userId: user.id, role: user.role });
    await writeAuditLog({
      userId: user.id,
      action: "AUTH_LOGIN",
      meta: { email: user.email },
      ipAddress: req.ip,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export { router as authRouter };
