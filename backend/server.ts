import express, {
  Request,
  Response,
  NextFunction,
} from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db";
import { processExpiredRecords } from "./services/expiryService";

import authRoutes from "./routes/authRoutes";
import membershipPlanRoutes from "./routes/membershipPlanRoutes";
import membershipRoutes from "./routes/membershipRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import certificateRoutes from "./routes/certificateRoutes";
import adminRoutes from "./routes/adminRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import userRoutes from "./routes/userRoutes";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ==============================
// Allowed Frontend Origins
// ==============================

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

// ==============================
// Middleware
// ==============================

app.use(
  cors({
    origin: (
      origin: string | undefined,
      callback: (
        error: Error | null,
        allow?: boolean
      ) => void
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(
        new Error(`CORS blocked origin: ${origin}`)
      );
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==============================
// API Routes
// ==============================

app.use("/api/auth", authRoutes);

app.use(
  "/api/membership-plans",
  membershipPlanRoutes
);

app.use("/api/memberships", membershipRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/certificates", certificateRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/users", userRoutes);

// ==============================
// Health Check
// ==============================

app.get(
  "/health",
  (_req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      message: "E-Membership API is running",
    });
  }
);

// ==============================
// 404 Handler
// ==============================

app.use(
  (_req: Request, res: Response) => {
    return res.status(404).json({
      success: false,
      message: "Route not found",
    });
  }
);

// ==============================
// Error Handler
// ==============================

app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error(
      "Unhandled server error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Internal server error";

    return res.status(500).json({
      success: false,
      message,
    });
  }
);

// ==============================
// Start Server
// ==============================

async function startServer(): Promise<void> {
  try {
    console.log("Connecting to MongoDB...");

    await connectDB();

    console.log("Running expiry check...");

    await processExpiredRecords();

    app.listen(PORT, () => {
      console.log(
        `Backend running on http://localhost:${PORT}`
      );

      console.log(
        `Health: http://localhost:${PORT}/health`
      );

      console.log(
        `Register: POST http://localhost:${PORT}/api/auth/register`
      );

      console.log(
        `Login: POST http://localhost:${PORT}/api/auth/login`
      );

      console.log(
        `Membership Plans: http://localhost:${PORT}/api/membership-plans`
      );

      console.log(
        `Memberships: http://localhost:${PORT}/api/memberships`
      );

      console.log(
        `Payments: http://localhost:${PORT}/api/payments`
      );

      console.log(
        `Certificates: http://localhost:${PORT}/api/certificates`
      );

      console.log(
        `Admin: http://localhost:${PORT}/api/admin`
      );

      console.log(
        `Users: http://localhost:${PORT}/api/users`
      );

      console.log(
        `Notifications: http://localhost:${PORT}/api/notifications`
      );

      console.log(
        "Expiry check completed successfully."
      );
    });
  } catch (error: unknown) {
    console.error(
      "Failed to start server:",
      error
    );

    process.exit(1);
  }
}

void startServer();