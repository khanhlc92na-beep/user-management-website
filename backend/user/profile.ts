import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";
import { User } from "./types";
import { getAuthData } from "~encore/auth";

// Gets current user profile.
export const getProfile = api<void, User>(
  { auth: true, expose: true, method: "GET", path: "/user/profile" },
  async () => {
    const auth = getAuthData()!;
    
    const user = await userDB.queryRow`
      SELECT id, email, first_name, last_name, role, avatar_url, google_id, email_verified, created_at, updated_at
      FROM users WHERE id = ${auth.userID}
    `;

    if (!user) {
      throw APIError.notFound("user not found");
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      avatarUrl: user.avatar_url,
      googleId: user.google_id,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }
);
