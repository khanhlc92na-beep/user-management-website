import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";
import { ForgotPasswordRequest } from "./types";
import crypto from "crypto";

// Initiates password reset process.
export const forgotPassword = api<ForgotPasswordRequest, { message: string }>(
  { expose: true, method: "POST", path: "/auth/forgot-password" },
  async (req) => {
    const user = await userDB.queryRow`
      SELECT id FROM users WHERE email = ${req.email}
    `;

    if (!user) {
      // Don't reveal if email exists or not
      return { message: "If the email exists, a reset link has been sent." };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    await userDB.exec`
      UPDATE users 
      SET reset_token = ${resetToken}, reset_token_expires = ${resetTokenExpires}, updated_at = CURRENT_TIMESTAMP
      WHERE email = ${req.email}
    `;

    // In a real app, you would send an email with the reset link
    return { message: "If the email exists, a reset link has been sent." };
  }
);
