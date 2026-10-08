import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Notification from "../models/Notification";
import mongoose from "mongoose";
import { escapeRegExp } from "../utils/escapeRegExp";

export async function getMyNotifications(
  req: AuthRequest,
  res: Response
) {
  if (!req.user?.userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filter = { user: req.user.userId };
    const [notifications, total, unread] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, readAt: { $exists: false } }),
    ]);

    return res.status(200).json({
      success: true,
      notifications,
      unread,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting notifications",
    });
  }
}

export async function markNotificationRead(
  req: AuthRequest,
  res: Response
) {
  if (!req.user?.userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }
  const id = String(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification ID",
    });
  }

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user.userId },
      { $set: { readAt: new Date() } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }
    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating notification",
    });
  }
}

export async function markAllNotificationsRead(
  req: AuthRequest,
  res: Response
) {
  if (!req.user?.userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const result = await Notification.updateMany(
      { user: req.user.userId, readAt: { $exists: false } },
      { $set: { readAt: new Date() } }
    );
    return res.status(200).json({
      success: true,
      updated: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating notifications",
    });
  }
}

export async function getAdminNotifications(
  req: AuthRequest,
  res: Response
) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const escapedSearch = escapeRegExp(search);
    const filter = search
      ? {
          $or: [
            { title: { $regex: escapedSearch, $options: "i" } },
            { message: { $regex: escapedSearch, $options: "i" } },
          ],
        }
      : {};
    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate("user", "name email")
        .populate("membership", "status expiryDate")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get admin notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting notifications",
    });
  }
}