import { parse as parseCsv } from "csv-parse/sync";
import pdfParse from "pdf-parse";
import Tesseract from "tesseract.js";

export type DocumentIntel = {
  rawText: string;
  detectedSource: "PDF" | "IMAGE" | "CSV" | "SUMMARY" | "OTHER";
  entities: {
    estimatedScore: number | null;
    utilization: number | null;
    latePayments: number;
    collections: number;
    inquiries: number;
  };
  accountMap: Array<{
    accountName: string;
    status: string;
    balance?: number;
    limit?: number;
  }>;
  highRiskBehaviors: string[];
};

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function parsePotentialMoney(value: string): number | undefined {
  const clean = value.replace(/[^\d.]/g, "");
  if (!clean) return undefined;
  const num = Number(clean);
  return Number.isFinite(num) ? num : undefined;
}

function extractEntities(text: string): DocumentIntel["entities"] {
  const lowered = text.toLowerCase();
  const score = text.match(/\b(?:score|fico)\D{0,8}(\d{3})\b/i)?.[1];
  const utilization = text.match(/\butilization\D{0,8}(\d{1,3})%/i)?.[1];

  return {
    estimatedScore: score ? Number(score) : null,
    utilization: utilization ? Number(utilization) : null,
    latePayments: (lowered.match(/late payment/g) ?? []).length,
    collections: (lowered.match(/collection/g) ?? []).length,
    inquiries: (lowered.match(/hard inquiry/g) ?? []).length,
  };
}

function mapAccounts(text: string) {
  const accountMap: DocumentIntel["accountMap"] = [];
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    if (!/(bank|capital|credit|loan|card|finance|auto|student)/i.test(line)) continue;
    const balanceMatch = line.match(/balance\D*([$0-9,]+)/i);
    const limitMatch = line.match(/limit\D*([$0-9,]+)/i);
    const statusMatch = line.match(/(open|closed|charged off|collection|late|current)/i);

    accountMap.push({
      accountName: line.slice(0, 90),
      status: statusMatch?.[1]?.toLowerCase() ?? "unknown",
      balance: balanceMatch?.[1] ? parsePotentialMoney(balanceMatch[1]) : undefined,
      limit: limitMatch?.[1] ? parsePotentialMoney(limitMatch[1]) : undefined,
    });

    if (accountMap.length >= 12) break;
  }

  return accountMap;
}

function parseCsvBuffer(fileBuffer: Buffer): string {
  const content = fileBuffer.toString("utf-8");
  const rows = parseCsv(content, { skip_empty_lines: true }) as string[][];
  return rows.map((row) => row.join(" | ")).join("\n");
}

export async function parseUploadedDocument(
  fileBuffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<DocumentIntel> {
  let extractedText = "";
  let detectedSource: DocumentIntel["detectedSource"] = "OTHER";

  if (mimeType.includes("pdf") || originalName.toLowerCase().endsWith(".pdf")) {
    const parsed = await (pdfParse as unknown as (buffer: Buffer) => Promise<{ text: string }>)(fileBuffer);
    extractedText = parsed.text ?? "";
    detectedSource = "PDF";
  } else if (
    mimeType.includes("image") ||
    /\.(png|jpg|jpeg|webp)$/i.test(originalName)
  ) {
    const recognized = await Tesseract.recognize(fileBuffer, "eng");
    extractedText = recognized.data.text;
    detectedSource = "IMAGE";
  } else if (mimeType.includes("csv") || originalName.toLowerCase().endsWith(".csv")) {
    extractedText = parseCsvBuffer(fileBuffer);
    detectedSource = "CSV";
  } else {
    extractedText = fileBuffer.toString("utf-8");
    detectedSource = "SUMMARY";
  }

  const rawText = normalizeText(extractedText);
  const entities = extractEntities(rawText);
  const accountMap = mapAccounts(extractedText);
  const highRiskBehaviors: string[] = [];

  if ((entities.utilization ?? 0) > 30) highRiskBehaviors.push("High revolving utilization detected.");
  if (entities.latePayments > 0) highRiskBehaviors.push("Late payment language appears in report text.");
  if (entities.collections > 0) highRiskBehaviors.push("Collections references detected.");
  if (entities.inquiries > 3) highRiskBehaviors.push("Heavy hard inquiry velocity detected.");

  return {
    rawText,
    detectedSource,
    entities,
    accountMap,
    highRiskBehaviors,
  };
}

export async function extractDocumentIntel(fileBuffer: Buffer, mimeType: string): Promise<DocumentIntel> {
  return parseUploadedDocument(fileBuffer, mimeType, "uploaded_document");
}
