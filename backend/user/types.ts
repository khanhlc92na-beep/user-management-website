export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin" | "super_admin";
  avatarUrl?: string;
  googleId?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: "user" | "admin" | "super_admin";
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  role?: "user" | "admin" | "super_admin";
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  googleToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UsersListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}
