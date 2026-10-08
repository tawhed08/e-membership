import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing from .env");
  }

  try {
    await mongoose.connect(mongoUri);

    console.log("MongoDB connected successfully");
    console.log(
      "MongoDB database:",
      mongoose.connection.db?.databaseName
    );
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}