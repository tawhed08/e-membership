export function validateEnvironment(): void {
  const missing = ["MONGODB_URI", "JWT_SECRET"].filter(
    (key) => !process.env[key]?.trim()
  );

  if (missing.length > 0) {
    throw new Error(
      `Required environment variables are missing: ${missing.join(", ")}`
    );
  }

  const port = Number(process.env.PORT || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
}