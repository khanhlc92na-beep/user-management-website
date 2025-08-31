import { authHandler } from "encore.dev/auth";
import { Header, Cookie, APIError, Gateway } from "encore.dev/api";
import { secret } from "encore.dev/config";
import jwt from "jsonwebtoken";

const jwtSecret = secret("JWTSecret");

interface AuthParams {
  authorization?: Header<"Authorization">;
  session?: Cookie<"session">;
}

export interface AuthData {
  userID: string;
  email: string;
  role: "user" | "admin" | "super_admin";
  firstName: string;
  lastName: string;
}

const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    const token = data.authorization?.replace("Bearer ", "") ?? data.session?.value;
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      // Use a default secret for local development if not configured
      const secretKey = jwtSecret() || "default-local-secret-key-change-in-production";
      const decoded = jwt.verify(token, secretKey) as any;
      return {
        userID: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err);
    }
  }
);

export const gw = new Gateway({ authHandler: auth });
