import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";
import { GoogleLoginRequest, AuthResponse } from "./types";
import jwt from "jsonwebtoken";
import { secret } from "encore.dev/config";

const jwtSecret = secret("JWTSecret");
const googleClientId = secret("GoogleClientId");

// Authenticates user with Google OAuth token.
export const googleLogin = api<GoogleLoginRequest, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/google" },
  async (req) => {
    // In a real implementation, you would verify the Google token
    // For now, we'll simulate the Google user data
    // You would use Google's token verification API here
    
    // Simulated Google user data (replace with actual Google API call)
    const googleUser = {
      id: "google_user_id",
      email: "user@gmail.com",
      given_name: "John",
      family_name: "Doe",
      picture: "https://example.com/avatar.jpg",
    };

    let user = await userDB.queryRow`
      SELECT id, email, first_name, last_name, role, avatar_url, email_verified, created_at, updated_at
      FROM users WHERE google_id = ${googleUser.id} OR email = ${googleUser.email}
    `;

    if (!user) {
      // Create new user from Google data
      await userDB.exec`
        INSERT INTO users (email, first_name, last_name, google_id, avatar_url, email_verified, role)
        VALUES (${googleUser.email}, ${googleUser.given_name}, ${googleUser.family_name}, ${googleUser.id}, ${googleUser.picture}, TRUE, 'user')
      `;

      user = await userDB.queryRow`
        SELECT id, email, first_name, last_name, role, avatar_url, email_verified, created_at, updated_at
        FROM users WHERE google_id = ${googleUser.id}
      `;
    } else if (!user.google_id) {
      // Link existing account with Google
      await userDB.exec`
        UPDATE users 
        SET google_id = ${googleUser.id}, email_verified = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${user.id}
      `;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      jwtSecret(),
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
