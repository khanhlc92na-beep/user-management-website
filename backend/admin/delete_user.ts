import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { getAuthData } from "~encore/auth";

const userDB = SQLDatabase.named("user");

interface DeleteUserParams {
  id: string;
}

// Deletes a user (admin only).
export const deleteUser = api<DeleteUserParams, { message: string }>(
  { auth: true, expose: true, method: "DELETE", path: "/admin/users/:id" },
  async (req) => {
    const auth = getAuthData()!;
    
    if (auth.role !== "admin" && auth.role !== "super_admin") {
      throw APIError.permissionDenied("admin access required");
    }

    // Prevent self-deletion
    if (req.id === auth.userID) {
      throw APIError.invalidArgument("cannot delete your own account");
    }

    const targetUser = await userDB.queryRow`
      SELECT role FROM users WHERE id = ${req.id}
    `;

    if (!targetUser) {
      throw APIError.notFound("user not found");
    }

    // Only super admin can delete admin users
    if (targetUser.role === "admin" && auth.role !== "super_admin") {
      throw APIError.permissionDenied("super admin access required to delete admin users");
    }

    if (targetUser.role === "super_admin" && auth.role !== "super_admin") {
      throw APIError.permissionDenied("super admin access required to delete super admin users");
    }

    await userDB.exec`DELETE FROM users WHERE id = ${req.id}`;

    return { message: "User deleted successfully" };
  }
);
