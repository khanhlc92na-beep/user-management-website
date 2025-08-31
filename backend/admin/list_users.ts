import { api, APIError, Query } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { UsersListResponse } from "../user/types";
import { getAuthData } from "~encore/auth";

const userDB = SQLDatabase.named("user");

interface ListUsersParams {
  page?: Query<number>;
  limit?: Query<number>;
  search?: Query<string>;
  role?: Query<string>;
}

// Lists all users with pagination and search (admin only).
export const listUsers = api<ListUsersParams, UsersListResponse>(
  { auth: true, expose: true, method: "GET", path: "/admin/users" },
  async (req) => {
    const auth = getAuthData()!;
    
    if (auth.role !== "admin" && auth.role !== "super_admin") {
      throw APIError.permissionDenied("admin access required");
    }

    const page = req.page || 1;
    const limit = req.limit || 10;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (req.search) {
      whereClause += ` AND (first_name ILIKE $${params.length + 1} OR last_name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`;
      params.push(`%${req.search}%`);
    }

    if (req.role) {
      whereClause += ` AND role = $${params.length + 1}`;
      params.push(req.role);
    }

    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const totalResult = await userDB.rawQueryRow(countQuery, ...params);
    const total = parseInt(totalResult.total);

    const usersQuery = `
      SELECT id, email, first_name, last_name, role, avatar_url, google_id, email_verified, created_at, updated_at
      FROM users ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    const users = await userDB.rawQueryAll(usersQuery, ...params, limit, offset);

    return {
      users: users.map(user => ({
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
      })),
      total,
      page,
      limit,
    };
  }
);
