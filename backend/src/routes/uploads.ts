import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Router } from "express";
import multer from "multer";

import { config } from "../config";
import { requireAuth } from "../middleware/auth";
import { createAuditLog } from "../lib/audit";
import { prisma } from "../lib/prisma";
import { encryptData } from "../lib/encryption";
import { extractDocumentIntel } from "../services/ocrService";
import { HttpError } from "../utils/httpError";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

export const uploadsRouter = Router();

uploadsRouter.post(
  "/documents",
  requireAuth,
  upload.single("document"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new HttpError(400, "Missing document upload.");
      }

      await fs.mkdir(config.uploadDir, { recursive: true });
      const storageName = `${randomUUID()}.bin`;
      const diskPath = path.join(config.uploadDir, storageName);

      const intel = await extractDocumentIntel(req.file.buffer, req.file.mimetype);
      const encrypted = encryptData(req.file.buffer);
      const payload = Buffer.concat([encrypted.iv, encrypted.data]);
      await fs.writeFile(diskPath, payload);

      const document = await prisma.uploadedDocument.create({
        data: {
          userId: req.user!.id,
          sourceType: "UPLOAD",
          originalName: req.file.originalname,
          storedName: storageName,
          mimeType: req.file.mimetype,
          byteSize: req.file.size,
          diskPath,
          extractedText: intel.rawText.slice(0, 100_000),
          extractedJson: intel.entities as object,
          status: "ANALYZED",
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        action: "DOCUMENT_UPLOADED",
        metadata: {
          documentId: document.id,
          sourceType: intel.detectedSource,
          issueCount: intel.highRiskBehaviors.length,
        },
      });

      res.status(201).json({
        documentId: document.id,
        summary: {
          sourceType: intel.detectedSource,
          estimatedScore: intel.entities.estimatedScore,
          utilization: intel.entities.utilization,
          highRiskBehaviors: intel.highRiskBehaviors,
          accountMap: intel.accountMap,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);
