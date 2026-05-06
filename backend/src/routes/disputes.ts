import { Router } from "express";
import { z } from "zod";

import { createAuditLog } from "../lib/audit";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { generateDisputeLetter } from "../services/disputeService";
import { HttpError } from "../utils/httpError";

const disputePayloadSchema = z.object({
  bureau: z.enum(["EXPERIAN", "EQUIFAX", "TRANSUNION", "CREDITOR", "CFPB"]),
  creditorName: z.string().min(2),
  accountType: z.string().min(2),
  issueType: z.enum([
    "INACCURATE_BALANCE",
    "DUPLICATE_ACCOUNT",
    "UNKNOWN_ACCOUNT",
    "LATE_PAYMENT_ERROR",
    "CHARGEOFF_ERROR",
    "INQUIRY_NOT_AUTHORIZED",
    "COLLECTION_NOT_MINE",
    "GOODWILL_REQUEST",
    "METHOD_OF_VERIFICATION",
    "DEBT_VALIDATION",
    "SETTLEMENT_NEGOTIATION",
    "CEASE_COMMUNICATION",
  ]),
  accountReference: z.string().optional(),
  userGoal: z.string().default("Optimize credit profile lawfully."),
  facts: z.array(z.string().min(3)).min(1),
  evidence: z.array(z.string()).default([]),
  request: z.string().min(3),
});

const statusSchema = z.object({
  status: z.enum(["OPEN", "SUBMITTED", "RESPONDED", "ESCALATED", "CLOSED"]),
  note: z.string().optional(),
});

export const disputeRouter = Router();

disputeRouter.post("/letters/generate", requireAuth, async (req, res, next) => {
  try {
    const payload = disputePayloadSchema.parse(req.body);
    const generated = await generateDisputeLetter({
      bureau: payload.bureau,
      issueType: payload.issueType,
      creditorName: payload.creditorName,
      accountType: payload.accountType,
      accountReference: payload.accountReference,
      userGoal: payload.userGoal,
      facts: payload.facts,
      evidence: payload.evidence,
      request: payload.request,
    });

    const dispute = await prisma.disputeCase.create({
      data: {
        userId: req.user!.id,
        bureau: payload.bureau,
        creditorName: payload.creditorName,
        accountType: payload.accountType,
        issueType: payload.issueType,
        accountReference: payload.accountReference,
        userGoal: payload.userGoal,
        facts: payload.facts,
        evidence: payload.evidence,
      },
    });

    const letter = await prisma.disputeLetter.create({
      data: {
        userId: req.user!.id,
        disputeCaseId: dispute.id,
        letterType: payload.issueType,
        subject: generated.subject,
        body: generated.body,
        requiresReview: true,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: "DISPUTE_LETTER_GENERATED",
      metadata: {
        disputeCaseId: dispute.id,
        letterId: letter.id,
        bureau: payload.bureau,
      },
    });

    res.status(201).json({
      disputeCaseId: dispute.id,
      letterId: letter.id,
      escalationTimeline: generated.escalationTimeline,
      letter: {
        subject: generated.subject,
        body: generated.body,
        complianceNotes: generated.complianceNotes,
      },
    });
  } catch (error) {
    next(error);
  }
});

disputeRouter.get("/letters/:letterId", requireAuth, async (req, res, next) => {
  try {
    const letter = await prisma.disputeLetter.findFirst({
      where: {
        id: String(req.params.letterId),
        userId: req.user!.id,
      },
      include: {
        disputeCase: true,
      },
    });

    if (!letter) {
      throw new HttpError(404, "Letter not found.");
    }

    res.json(letter);
  } catch (error) {
    next(error);
  }
});

disputeRouter.patch("/cases/:caseId/status", requireAuth, async (req, res, next) => {
  try {
    const payload = statusSchema.parse(req.body);
    const existing = await prisma.disputeCase.findFirst({
      where: { id: String(req.params.caseId), userId: req.user!.id },
    });
    if (!existing) {
      throw new HttpError(404, "Dispute case not found.");
    }

    const updated = await prisma.disputeCase.update({
      where: { id: existing.id },
      data: {
        status: payload.status,
        timelineNotes: payload.note ? [payload.note] : undefined,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: "DISPUTE_STATUS_UPDATED",
      metadata: {
        caseId: updated.id,
        status: payload.status,
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});
