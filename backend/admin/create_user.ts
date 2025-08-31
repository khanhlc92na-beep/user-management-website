import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { CreateUserRequest, User } from "../user/types";
import { getAuthData } from "~encore/auth";
import bcrypt from "bcryptjs";

const userDB = SQLDatabase.named("user");

// Creates a new user (admin only).
export const createUser = api<CreateUserRequest, User>(
  { auth: true, expose: true, method: "POST", path: "/admin/users" },
  async (req) => {
    const auth = getAuthData()!;
    
    if (auth.role !== "admin" && auth.role !== "super_admin") {
      throw APIError.permissionDenied("admin access required");
    }

    // Only super admin can create admin users
    if (req.role === "admin" && auth.role !== "super_admin") {
      throw APIError.permissionDenied("super admin access required to create admin users");
    }

    if (req.role === "super_admin" && auth.role !== "super_admin") {
      throw APIError.permissionDenied("super admin access required to create super admin users");
    }

    const existingUser = await userDB.queryRow`
      SELECT id FROM users WHERE email = ${req.email}
    `;

    if (existingUser) {
      throw APIError.alreadyExists("user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(req.password, 12);

    const user = await userDB.queryRow`
      INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
      VALUES (${req.email}, ${passwordHash}, ${req.firstName}, ${req.lastName}, ${req.role || "user"}, TRUE)
      RETURNING id, email, first_name, last_name, role, avatar_url, google_id, email_verified, created_at, updated_at
    `;

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
