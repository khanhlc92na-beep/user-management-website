import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";
import { ChangePasswordRequest } from "./types";
import { getAuthData } from "~encore/auth";
import bcrypt from "bcryptjs";

// Changes current user password.
export const changePassword = api<ChangePasswordRequest, { message: string }>(
  { auth: true, expose: true, method: "POST", path: "/user/change-password" },
  async (req) => {
    const auth = getAuthData()!;
    
    const user = await userDB.queryRow`
      SELECT password_hash FROM users WHERE id = ${auth.userID}
    `;

    if (!user || !user.password_hash) {
      throw APIError.notFound("user not found or no password set");
    }

    const isValidPassword = await bcrypt.compare(req.currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw APIError.unauthenticated("current password is incorrect");
    }

    const newPasswordHash = await bcrypt.hash(req.newPassword, 12);

    await userDB.exec`
      UPDATE users 
      SET password_hash = ${newPasswordHash}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${auth.userID}
    `;

    return { message: "Password changed successfully" };
  }
);
