import { Request, Response } from "express";
import mongoose from "mongoose";
import MembershipPlan from "../models/MembershipPlan";

export async function getActivePlans(
  _req: Request,
  res: Response
) {
  try {
    const plans = await MembershipPlan.find({
      isActive: true,
    }).sort({
      price: 1,
    });

    return res.status(200).json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("Get active plans error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting membership plans",
    });
  }
}

export async function getAllPlans(
  _req: Request,
  res: Response
) {
  try {
    const plans = await MembershipPlan.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("Get all plans error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting membership plans",
    });
  }
}

export async function createPlan(
  req: Request,
  res: Response
) {
  try {
    const {
      name,
      description,
      price,
      durationDays,
    } = req.body;

    if (
      typeof name !== "string" ||
      typeof description !== "string" ||
      !name.trim() ||
      !description.trim() ||
      price === undefined ||
      durationDays === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, description, price and duration are required",
      });
    }

    const parsedPrice = Number(price);
    const parsedDuration = Number(durationDays);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a non-negative number",
      });
    }

    if (!Number.isInteger(parsedDuration) || parsedDuration < 1) {
      return res.status(400).json({
        success: false,
        message: "Duration must be a positive whole number of days",
      });
    }

    const plan = await MembershipPlan.create({
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      durationDays: parsedDuration,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Membership plan created successfully",
      plan,
    });
  } catch (error) {
    console.error("Create plan error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating membership plan",
    });
  }
}

export async function updatePlan(
  req: Request,
  res: Response
) {
  try {
    const id = String(req.params.id);
    const {
      name,
      description,
      price,
      durationDays,
      isActive,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid membership plan ID",
      });
    }

    const plan = await MembershipPlan.findById(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found",
      });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Plan name must be a non-empty string",
        });
      }
      plan.name = String(name).trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        return res.status(400).json({
          success: false,
          message: "Plan description must be a non-empty string",
        });
      }
      plan.description = String(description).trim();
    }

    if (price !== undefined) {
      const parsedPrice = Number(price);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a non-negative number",
        });
      }

      plan.price = parsedPrice;
    }

    if (durationDays !== undefined) {
      const parsedDuration = Number(durationDays);
      if (!Number.isInteger(parsedDuration) || parsedDuration < 1) {
        return res.status(400).json({
          success: false,
          message: "Duration must be a positive whole number of days",
        });
      }

      plan.durationDays = parsedDuration;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean",
        });
      }
      plan.isActive = isActive;
    }

    await plan.save();

    return res.status(200).json({
      success: true,
      message: "Membership plan updated successfully",
      plan,
    });
  } catch (error) {
    console.error("Update plan error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating membership plan",
    });
  }
}

export async function deactivatePlan(
  req: Request,
  res: Response
) {
  try {
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid membership plan ID",
      });
    }

    const plan = await MembershipPlan.findById(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found",
      });
    }

    plan.isActive = false;

    await plan.save();

    return res.status(200).json({
      success: true,
      message: "Membership plan deactivated successfully",
      plan,
    });
  } catch (error) {
    console.error("Deactivate plan error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Server error while deactivating membership plan",
    });
  }
}