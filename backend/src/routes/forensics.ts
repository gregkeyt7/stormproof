import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../middleware/auth";
import { createAuditLog } from "../lib/audit";
import { prisma } from "../lib/prisma";
import { runForensicAnalysis } from "../services/forensicsService";
import { summarizeForensicsWithAI } from "../services/aiService";

const profileSchema = z.object({
  creditScore: z.number().min(300).max(850),
  utilization: z.number().min(0).max(100),
  latePayments: z.number().min(0).max(100),
  collections: z.number().min(0).max(100),
  inquiries: z.number().min(0).max(100),
  oldestAccountYears: z.number().min(0).max(100),
  debtToIncome: z.number().min(0).max(100),
  revolvingDebt: z.number().min(0),
  installmentDebt: z.number().min(0),
  annualIncome: z.number().min(0),
  accountsOpen: z.number().min(0).max(200),
  documentId: z.string().optional(),
});

export const forensicsRouter = Router();

forensicsRouter.post("/analyze", requireAuth, async (req, res, next) => {
  try {
    const profile = profileSchema.parse(req.body);
    const analysis = runForensicAnalysis(profile);
    const aiNarrative = await summarizeForensicsWithAI({
      ...analysis,
      primaryGoal: req.body.primaryGoal ?? "Optimize profile for higher approvals.",
    });

    const creditProfile = await prisma.creditProfile.create({
      data: {
        userId: req.user!.id,
        creditScore: profile.creditScore,
        utilization: profile.utilization,
        latePayments: profile.latePayments,
        collections: profile.collections,
        inquiries: profile.inquiries,
        oldestAccountYears: profile.oldestAccountYears,
        debtToIncome: profile.debtToIncome,
        revolvingDebt: profile.revolvingDebt,
        installmentDebt: profile.installmentDebt,
        annualIncome: profile.annualIncome,
        accountsOpen: profile.accountsOpen,
        sourceDocumentId: profile.documentId,
      },
    });

    const forensic = await prisma.forensicAnalysis.create({
      data: {
        userId: req.user!.id,
        creditProfileId: creditProfile.id,
        approvalRiskScore: analysis.approvalRiskScore,
        scoreSuppressionScore: analysis.scoreSuppressionScore,
        lenderPerception: analysis.lenderPerception,
        scoreSuppressionFactors: analysis.scoreSuppressionFactors as object,
        utilizationOptimizationMap: analysis.utilizationOptimizationMap as object,
        fastestImpactActions: analysis.fastestImpactActions as object,
        aiNarrative,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: "FORENSIC_ANALYSIS_RUN",
      metadata: {
        forensicId: forensic.id,
        profileId: creditProfile.id,
        approvalRiskScore: analysis.approvalRiskScore,
      },
    });

    res.status(201).json({
      forensicId: forensic.id,
      creditProfileId: creditProfile.id,
      analysis: {
        ...analysis,
        aiNarrative,
      },
    });
  } catch (error) {
    next(error);
  }
});
