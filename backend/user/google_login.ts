import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";
import { GoogleLoginRequest, AuthResponse } from "./types";
import jwt from "jsonwebtoken";
import { secret } from "encore.dev/config";

const jwtSecret = secret("JWTSecret");
const googleClientId = secret("GoogleClientId");
const googleClientSecret = secret("GoogleClientSecret");

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

// Authenticates user with Google OAuth token.
export const googleLogin = api<GoogleLoginRequest, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/google" },
  async (req) => {
    // Check if Google OAuth is configured
    const clientId = googleClientId();
    const clientSecret = googleClientSecret();
    
    if (!clientId || !clientSecret) {
      throw APIError.unimplemented("Google OAuth is not configured");
    }

    try {
      // Exchange authorization code for access token
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code: req.googleToken,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: "postmessage", // For popup flow
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        throw APIError.unauthenticated("Invalid Google authorization code");
      }

      const tokenData: GoogleTokenResponse = await tokenResponse.json();

      // Get user info from Google
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw APIError.unauthenticated("Failed to get user info from Google");
      }

      const googleUser: GoogleUserInfo = await userResponse.json();

      if (!googleUser.verified_email) {
        throw APIError.permissionDenied("Google email is not verified");
      }

      // Check if user exists
      let user = await userDB.queryRow`
        SELECT id, email, first_name, last_name, role, avatar_url, google_id, email_verified, created_at, updated_at
        FROM users WHERE google_id = ${googleUser.id} OR email = ${googleUser.email}
      `;

      if (!user) {
        // Create new user from Google data
        await userDB.exec`
          INSERT INTO users (email, first_name, last_name, google_id, avatar_url, email_verified, role)
          VALUES (${googleUser.email}, ${googleUser.given_name}, ${googleUser.family_name}, ${googleUser.id}, ${googleUser.picture}, TRUE, 'user')
        `;

        user = await userDB.queryRow`
          SELECT id, email, first_name, last_name, role, avatar_url, google_id, email_verified, created_at, updated_at
          FROM users WHERE google_id = ${googleUser.id}
        `;
      } else if (!user.google_id) {
        // Link existing account with Google
        await userDB.exec`
          UPDATE users 
          SET google_id = ${googleUser.id}, email_verified = TRUE, avatar_url = COALESCE(avatar_url, ${googleUser.picture}), updated_at = CURRENT_TIMESTAMP
          WHERE id = ${user.id}
        `;
        
        // Refresh user data
        user = await userDB.queryRow`
          SELECT id, email, first_name, last_name, role, avatar_url, google_id, email_verified, created_at, updated_at
          FROM users WHERE id = ${user.id}
        `;
      }

      if (!user) {
        throw APIError.internal("Failed to create or retrieve user");
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
          googleId: user.google_id,
          emailVerified: user.email_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error("Google login error:", error);
      throw APIError.internal("Google authentication failed");
    }
  }
);
