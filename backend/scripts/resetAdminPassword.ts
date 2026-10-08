import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import { connectDB } from "../config/db";
import User from "../models/User";

dotenv.config();

async function resetAdminPassword() {
  try {
    await connectDB();

    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const newPassword = process.env.ADMIN_NEW_PASSWORD;

    if (!email || !newPassword || newPassword.length < 8) {
      throw new Error(
        "Set ADMIN_EMAIL and an ADMIN_NEW_PASSWORD of at least 8 characters"
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("Admin user not found");
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      12
    );

    user.password = hashedPassword;
    user.role = "admin";
    user.isActive = true;

    await user.save();

    console.log("Admin password reset successfully");

    process.exit(0);
  } catch (error) {
    console.error(
      "Failed to reset admin password:",
      error
    );

    process.exit(1);
  }
}

resetAdminPassword();