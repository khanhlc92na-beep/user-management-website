import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { UpdateUserRequest, User } from "../user/types";
import { getAuthData } from "~encore/auth";

const userDB = SQLDatabase.named("user");

interface UpdateUserParams {
  id: string;
}

interface AdminUpdateUserRequest extends UpdateUserRequest {
  id: string;
}

// Updates a user (admin only).
export const updateUser = api<AdminUpdateUserRequest, User>(
  { auth: true, expose: true, method: "PUT", path: "/admin/users/:id" },
  async (req) => {
    const auth = getAuthData()!;
    
    if (auth.role !== "admin" && auth.role !== "super_admin") {
      throw APIError.permissionDenied("admin access required");
    }

    const targetUser = await userDB.queryRow`
      SELECT role FROM users WHERE id = ${req.id}
    `;

    if (!targetUser) {
      throw APIError.notFound("user not found");
    }

    // Only super admin can modify admin users
    if (targetUser.role === "admin" && auth.role !== "super_admin") {
      throw APIError.permissionDenied("super admin access required to modify admin users");
    }

    if (targetUser.role === "super_admin" && auth.role !== "super_admin") {
      throw APIError.permissionDenied("super admin access required to modify super admin users");
    }

    // Only super admin can set admin role
    if (req.role === "admin" && auth.role !== "super_admin") {
      throw APIError.permissionDenied("super admin access required to set admin role");
    }

    if (req.role === "super_admin" && auth.role !== "super_admin") {
      throw APIError.permissionDenied("super admin access required to set super admin role");
    }

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
    
    if (req.role !== undefined) {
      updates.push(`role = $${values.length + 1}`);
      values.push(req.role);
    }
    
    if (req.avatarUrl !== undefined) {
      updates.push(`avatar_url = $${values.length + 1}`);
      values.push(req.avatarUrl);
    }
    
    if (updates.length === 0) {
      throw APIError.invalidArgument("no fields to update");
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.id);
    
    const query = `
      UPDATE users 
      SET ${updates.join(", ")}
      WHERE id = $${values.length}
      RETURNING id, email, first_name, last_name, role, avatar_url, google_id, email_verified, created_at, updated_at
    `;
    
    const user = await userDB.rawQueryRow(query, ...values);

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
