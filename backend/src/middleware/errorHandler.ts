import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError";

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, "Resource not found."));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: error.message, details: error.details ?? null });
    return;
  }

  const genericMessage = error instanceof Error ? error.message : "Unexpected server error.";
  res.status(500).json({ error: "Internal server error.", details: genericMessage });
}
