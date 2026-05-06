import { Router } from "express";

import { prisma } from "../lib/prisma";
import { requireAdmin, requireAuth } from "../middleware/auth";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/dashboard", async (_req, res, next) => {
  try {
    const [users, docs, analyses, disputes, simulations] = await Promise.all([
      prisma.user.count(),
      prisma.uploadedDocument.count(),
      prisma.forensicAnalysis.count(),
      prisma.disputeCase.count(),
      prisma.simulationRun.count(),
    ]);

    res.json({
      metrics: {
        users,
        uploadedDocuments: docs,
        forensicAnalyses: analyses,
        disputeCases: disputes,
        simulationRuns: simulations,
      },
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/audit-logs", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? "40"), 200);
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: Number.isNaN(limit) ? 40 : limit,
    });

    res.json({ logs });
  } catch (error) {
    next(error);
  }
});
