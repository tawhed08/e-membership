import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/authMiddleware";
import User from "../models/User";
import { escapeRegExp } from "../utils/escapeRegExp";

export async function updateMyProfile(
  req: AuthRequest,
  res: Response
) {
  const userId = req.user?.userId;
  const { name, phone } = req.body ?? {};

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }
  if (
    (name !== undefined &&
      (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100)) ||
    (phone !== undefined && typeof phone !== "string")
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid name and phone number",
    });
  }

  try {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim() || undefined;
    await user.save();
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
}

export async function changeMyPassword(
  req: AuthRequest,
  res: Response
) {
  const userId = req.user?.userId;
  const { currentPassword, newPassword } = req.body ?? {};
  if (
    !userId ||
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    newPassword.length < 8
  ) {
    return res.status(400).json({
      success: false,
      message: "Current password and a new password of at least 8 characters are required",
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while changing password",
    });
  }
}

export async function getAdminUsers(
  req: Request,
  res: Response
) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const status =
      req.query.status === "active" || req.query.status === "inactive"
        ? req.query.status
        : undefined;
    const filter: Record<string, unknown> = { role: "user" };
    if (search) {
      const escapedSearch = escapeRegExp(search);
      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
      ];
    }
    if (status) filter.isActive = status === "active";

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("name email phone role isActive createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);
    return res.status(200).json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get admin users error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting users",
    });
  }
}

export async function updateUserStatus(
  req: AuthRequest,
  res: Response
) {
  const id = String(req.params.id);
  const { isActive } = req.body ?? {};
  if (!mongoose.Types.ObjectId.isValid(id) || typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "Valid user ID and active status are required",
    });
  }

  try {
    const user = await User.findOneAndUpdate(
      { _id: id, role: "user" },
      { $set: { isActive, suspendedByAdmin: !isActive } },
      { new: true, runValidators: true }
    ).select("name email phone role isActive createdAt");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Regular user not found",
      });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Update user status error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating user",
    });
  }
}