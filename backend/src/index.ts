import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { config } from "./config";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth";
import { uploadsRouter } from "./routes/uploads";
import { forensicsRouter } from "./routes/forensics";
import { disputesRouter } from "./routes/disputes";
import { simulatorRouter } from "./routes/simulator";
import { businessRouter } from "./routes/business";
import { adminRouter } from "./routes/admin";
import { globalLimiter } from "./middleware/rateLimit";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(morgan("tiny"));
app.use(globalLimiter);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "credittitan-backend",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/forensics", forensicsRouter);
app.use("/api/disputes", disputesRouter);
app.use("/api/simulator", simulatorRouter);
app.use("/api/business", businessRouter);
app.use("/api/admin", adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`CreditTitan backend listening on http://localhost:${config.port}`);
});
