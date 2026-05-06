import { parse as parseCsv } from "csv-parse/sync";
import pdfParse from "pdf-parse";
import Tesseract from "tesseract.js";

export type ParsedCreditDocument = {
  rawText: string;
  entities: Array<{ type: string; value: string; confidence: number }>;
  accountMap: Array<{
    accountName: string;
    status: string;
    balance?: number;
    limit?: number;
  }>;
  metrics: {
    inferredScore?: number;
    inferredUtilization?: number;
    latePayments: number;
    collections: number;
    inquiries: number;
  };
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

function mapEntities(text: string) {
  const entities: ParsedCreditDocument["entities"] = [];
  const scoreMatch = text.match(/\b(?:score|fico)\D{0,8}(\d{3})\b/i);
  if (scoreMatch) {
    entities.push({ type: "credit_score", value: scoreMatch[1], confidence: 0.82 });
  }
  const utilizationMatch = text.match(/\butilization\D{0,8}(\d{1,3})%/i);
  if (utilizationMatch) {
    entities.push({ type: "utilization", value: `${utilizationMatch[1]}%`, confidence: 0.79 });
  }

  const bureauKeywords = ["experian", "equifax", "transunion"];
  bureauKeywords.forEach((bureau) => {
    if (text.toLowerCase().includes(bureau)) {
      entities.push({ type: "bureau", value: bureau, confidence: 0.74 });
    }
  });

  return entities;
}

function mapAccounts(text: string) {
  const accountMap: ParsedCreditDocument["accountMap"] = [];
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    if (!/(bank|capital|credit|loan|card|finance|auto|student)/i.test(line)) continue;
    const balanceMatch = line.match(/balance\D*([$0-9,]+)/i);
    const limitMatch = line.match(/limit\D*([$0-9,]+)/i);
    const statusMatch = line.match(/(open|closed|charged off|collection|late|current)/i);

    accountMap.push({
      accountName: line.slice(0, 90),
      status: statusMatch ? statusMatch[1].toLowerCase() : "unknown",
      balance: balanceMatch?.[1] ? parsePotentialMoney(balanceMatch[1]) : undefined,
      limit: limitMatch?.[1] ? parsePotentialMoney(limitMatch[1]) : undefined
    });

    if (accountMap.length >= 12) break;
  }

  return accountMap;
}

function inferMetrics(text: string): ParsedCreditDocument["metrics"] {
  const lowered = text.toLowerCase();
  const inferredScore = text.match(/\b(?:score|fico)\D{0,8}(\d{3})\b/i)?.[1];
  const inferredUtilization = text.match(/\butilization\D{0,8}(\d{1,3})%/i)?.[1];
  const latePayments = (lowered.match(/late payment/g) ?? []).length;
  const collections = (lowered.match(/collection/g) ?? []).length;
  const inquiries = (lowered.match(/hard inquiry/g) ?? []).length;

  return {
    inferredScore: inferredScore ? Number(inferredScore) : undefined,
    inferredUtilization: inferredUtilization ? Number(inferredUtilization) : undefined,
    latePayments,
    collections,
    inquiries
  };
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
): Promise<ParsedCreditDocument> {
  let extractedText = "";

  if (mimeType.includes("pdf") || originalName.toLowerCase().endsWith(".pdf")) {
    const parsed = await pdfParse(fileBuffer);
    extractedText = parsed.text ?? "";
  } else if (
    mimeType.includes("image") ||
    /\.(png|jpg|jpeg|webp)$/i.test(originalName)
  ) {
    const recognized = await Tesseract.recognize(fileBuffer, "eng");
    extractedText = recognized.data.text;
  } else if (mimeType.includes("csv") || originalName.toLowerCase().endsWith(".csv")) {
    extractedText = parseCsvBuffer(fileBuffer);
  } else {
    extractedText = fileBuffer.toString("utf-8");
  }

  const rawText = normalizeText(extractedText);
  return {
    rawText,
    entities: mapEntities(rawText),
    accountMap: mapAccounts(extractedText),
    metrics: inferMetrics(rawText)
  };
}
