import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Membership from "../models/Membership";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) : Promise<void> {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    res.status(500).json({
      success: false,
      message: "JWT_SECRET is missing",
    });
    return;
  }

  let userId: string;
  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (typeof decoded === "string" || typeof decoded.userId !== "string") {
      res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token",
      });
      return;
    }
    userId = decoded.userId;
  } catch (error) {
    console.error("Auth token verification error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
    return;
  }

  try {
    const user = await User.findById(userId).select(
      "role isActive suspendedByAdmin"
    );
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User account not found",
      });
      return;
    }
    if (!user.isActive) {
      const route = req.originalUrl.split("?")[0];
      const renewalRoutes =
        ((req.method === "GET" &&
          [
            "/api/auth/me",
            "/api/memberships/my",
            "/api/memberships/history",
            "/api/payments/my",
          ].includes(route)) ||
          (req.method === "PATCH" &&
            route === "/api/users/me/profile")) ||
        (req.method === "POST" &&
          [
            "/api/memberships",
            "/api/payments",
            "/api/payments/card/checkout",
          ].includes(route));
      const hasExpiredMembership =
        user.role === "user" &&
        !user.suspendedByAdmin &&
        renewalRoutes &&
        Boolean(
          await Membership.exists({
            user: user._id,
            status: "expired",
          })
        );
      if (!hasExpiredMembership) {
        res.status(403).json({
          success: false,
          message: "Your account is inactive",
        });
        return;
      }
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
    };
    next();
  } catch (error) {
    console.error("Auth user lookup failed:", error);
    next(error);
  }
}

export function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Admin access required",
    });
    return;
  }

  next();
}