import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";
import { LoginRequest, AuthResponse } from "./types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { secret } from "encore.dev/config";

const jwtSecret = secret("JWTSecret");

// Authenticates user with email and password.
export const login = api<LoginRequest, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    const user = await userDB.queryRow`
      SELECT id, email, password_hash, first_name, last_name, role, avatar_url, email_verified, created_at, updated_at
      FROM users WHERE email = ${req.email}
    `;

    if (!user || !user.password_hash) {
      throw APIError.unauthenticated("invalid credentials");
    }

    if (!user.email_verified) {
      throw APIError.permissionDenied("email not verified");
    }

    const isValidPassword = await bcrypt.compare(req.password, user.password_hash);
    if (!isValidPassword) {
      throw APIError.unauthenticated("invalid credentials");
    }

    // Use a default secret for local development if not configured
    const secretKey = jwtSecret() || "default-local-secret-key-change-in-production";
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      secretKey,
      { expiresIn: "7d" }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        avatarUrl: user.avatar_url,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    };
  }
);
