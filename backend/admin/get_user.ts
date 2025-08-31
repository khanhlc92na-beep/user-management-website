import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { User } from "../user/types";
import { getAuthData } from "~encore/auth";

const userDB = SQLDatabase.named("user");

interface GetUserParams {
  id: string;
}

// Gets a user by ID (admin only).
export const getUser = api<GetUserParams, User>(
  { auth: true, expose: true, method: "GET", path: "/admin/users/:id" },
  async (req) => {
    const auth = getAuthData()!;
    
    if (auth.role !== "admin" && auth.role !== "super_admin") {
      throw APIError.permissionDenied("admin access required");
    }

    const user = await userDB.queryRow`
      SELECT id, email, first_name, last_name, role, avatar_url, google_id, email_verified, created_at, updated_at
      FROM users WHERE id = ${req.id}
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
