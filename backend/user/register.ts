import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";
import { CreateUserRequest, AuthResponse } from "./types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { secret } from "encore.dev/config";
import crypto from "crypto";

const jwtSecret = secret("JWTSecret");

// Registers a new user with email verification.
export const register = api<CreateUserRequest, { message: string }>(
  { expose: true, method: "POST", path: "/auth/register" },
  async (req) => {
    const existingUser = await userDB.queryRow`
      SELECT id FROM users WHERE email = ${req.email}
    `;

    if (existingUser) {
      throw APIError.alreadyExists("user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(req.password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    await userDB.exec`
      INSERT INTO users (email, password_hash, first_name, last_name, role, verification_token, email_verified)
      VALUES (${req.email}, ${passwordHash}, ${req.firstName}, ${req.lastName}, ${req.role || "user"}, ${verificationToken}, TRUE)
    `;

    // For local development, we'll auto-verify emails
    // In production, you would send an email with the verification link
    return { message: "Registration successful. You can now log in." };
  }
);
