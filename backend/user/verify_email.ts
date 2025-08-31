import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";
import { VerifyEmailRequest } from "./types";

// Verifies user email with token.
export const verifyEmail = api<VerifyEmailRequest, { message: string }>(
  { expose: true, method: "POST", path: "/auth/verify-email" },
  async (req) => {
    const user = await userDB.queryRow`
      SELECT id FROM users WHERE verification_token = ${req.token}
    `;

    if (!user) {
      throw APIError.notFound("invalid verification token");
    }

    await userDB.exec`
      UPDATE users 
      SET email_verified = TRUE, verification_token = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE verification_token = ${req.token}
    `;

    return { message: "Email verified successfully" };
  }
);
