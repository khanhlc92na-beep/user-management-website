import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";
import { ResetPasswordRequest } from "./types";
import bcrypt from "bcryptjs";

// Resets user password with token.
export const resetPassword = api<ResetPasswordRequest, { message: string }>(
  { expose: true, method: "POST", path: "/auth/reset-password" },
  async (req) => {
    const user = await userDB.queryRow`
      SELECT id FROM users 
      WHERE reset_token = ${req.token} AND reset_token_expires > CURRENT_TIMESTAMP
    `;

    if (!user) {
      throw APIError.notFound("invalid or expired reset token");
    }

    const passwordHash = await bcrypt.hash(req.newPassword, 12);

    await userDB.exec`
      UPDATE users 
      SET password_hash = ${passwordHash}, reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE reset_token = ${req.token}
    `;

    return { message: "Password reset successfully" };
  }
);
