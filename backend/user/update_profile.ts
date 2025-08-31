import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";
import { UpdateUserRequest, User } from "./types";
import { getAuthData } from "~encore/auth";

// Updates current user profile.
export const updateProfile = api<UpdateUserRequest, User>(
  { auth: true, expose: true, method: "PUT", path: "/user/profile" },
  async (req) => {
    const auth = getAuthData()!;
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (req.firstName !== undefined) {
      updates.push(`first_name = $${values.length + 1}`);
      values.push(req.firstName);
    }
    
    if (req.lastName !== undefined) {
      updates.push(`last_name = $${values.length + 1}`);
      values.push(req.lastName);
    }
    
    if (req.avatarUrl !== undefined) {
      updates.push(`avatar_url = $${values.length + 1}`);
      values.push(req.avatarUrl);
    }
    
    if (updates.length === 0) {
      throw APIError.invalidArgument("no fields to update");
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(auth.userID);
    
    const query = `
      UPDATE users 
      SET ${updates.join(", ")}
      WHERE id = $${values.length}
      RETURNING id, email, first_name, last_name, role, avatar_url, google_id, email_verified, created_at, updated_at
    `;
    
    const user = await userDB.rawQueryRow(query, ...values);
    
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
