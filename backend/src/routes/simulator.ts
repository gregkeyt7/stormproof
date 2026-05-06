import { Router } from "express";
import { z } from "zod";

import { createAuditLog } from "../lib/audit";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { simulateCreditScenario } from "../services/simulatorService";

const simulationInputSchema = z.object({
  currentScore: z.number().min(300).max(850),
  utilization: z.number().min(0).max(100),
  latePayments: z.number().min(0).max(50),
  collections: z.number().min(0).max(50),
  inquiries: z.number().min(0).max(30),
  newAccounts: z.number().min(0).max(10).default(0),
  balanceTransfer: z.number().min(0).max(100).default(0),
  creditLimitIncrease: z.number().min(0).max(200_000).default(0),
  payoffAmount: z.number().min(0).max(2_000_000).default(0),
});

export const simulatorRouter = Router();

simulatorRouter.post("/run", requireAuth, async (req, res, next) => {
  try {
    const payload = simulationInputSchema.parse(req.body);
    const result = simulateCreditScenario(payload);

    const simulation = await prisma.simulationRun.create({
      data: {
        userId: req.user!.id,
        input: payload,
        output: result,
        currentScore: payload.currentScore,
        projectedScore: result.projectedScore,
        approvalOddsBefore: result.approvalOddsBefore,
        approvalOddsAfter: result.approvalOddsAfter,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: "SIMULATION_RUN",
      metadata: {
        simulationId: simulation.id,
        projectedScore: result.projectedScore,
      },
    });

    res.json({ simulationId: simulation.id, result });
  } catch (error) {
    next(error);
  }
});
