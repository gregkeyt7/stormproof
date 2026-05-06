import { Router } from "express";
import { z } from "zod";

import { createAuditLog } from "../lib/audit";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { buildBusinessCreditPlan } from "../services/businessCreditService";

const evaluateSchema = z.object({
  businessAgeMonths: z.number().min(0).max(600),
  monthlyRevenue: z.number().min(0),
  vendorTradelines: z.number().min(0).max(30),
  hasEin: z.boolean(),
  hasDuns: z.boolean(),
  hasBusinessBank: z.boolean(),
  entityType: z.string().min(2).max(20),
  personalScore: z.number().min(300).max(850),
});

export const businessRouter = Router();

businessRouter.post("/evaluate", requireAuth, async (req, res, next) => {
  try {
    const data = evaluateSchema.parse(req.body);
    const plan = buildBusinessCreditPlan(data);

    const profile = await prisma.businessProfile.upsert({
      where: { userId: req.user!.id },
      update: {
        businessAgeMonths: data.businessAgeMonths,
        monthlyRevenue: data.monthlyRevenue,
        vendorTradelines: data.vendorTradelines,
        hasEin: data.hasEin,
        hasDuns: data.hasDuns,
        hasBusinessBank: data.hasBusinessBank,
        entityType: data.entityType,
        readinessScore: plan.readinessScore,
      },
      create: {
        userId: req.user!.id,
        businessAgeMonths: data.businessAgeMonths,
        monthlyRevenue: data.monthlyRevenue,
        vendorTradelines: data.vendorTradelines,
        hasEin: data.hasEin,
        hasDuns: data.hasDuns,
        hasBusinessBank: data.hasBusinessBank,
        entityType: data.entityType,
        readinessScore: plan.readinessScore,
      },
    });

    await prisma.businessPlan.create({
      data: {
        userId: req.user!.id,
        profileId: profile.id,
        lenderRiskTier: plan.lenderRiskTier,
        readinessScore: plan.readinessScore,
        recommendations: plan.recommendations as object,
        sequencingPlan: plan.sequencingPlan as object,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: "BUSINESS_PLAN_GENERATED",
      metadata: {
        profileId: profile.id,
        readinessScore: plan.readinessScore,
      },
    });

    res.json(plan);
  } catch (error) {
    next(error);
  }
});
