import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, User, ArrowRight } from "lucide-react";

function HomePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to UserApp
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          A comprehensive user management system with role-based access control,
          authentication, and admin dashboard.
        </p>
      </div>

      {user ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Profile Management
              </CardTitle>
              <CardDescription>
                Update your personal information, change password, and manage your avatar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/profile">
                <Button className="w-full">
                  Go to Profile
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {(user.role === "admin" || user.role === "super_admin") && (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-green-600" />
                  Admin Dashboard
                </CardTitle>
                <CardDescription>
                  Manage users, create accounts, and control system access.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/admin">
                  <Button className="w-full">
                    Open Admin Panel
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-600" />
                Your Role
              </CardTitle>
              <CardDescription>
                Current access level and permissions in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  user.role === "super_admin" 
                    ? "bg-red-100 text-red-800"
                    : user.role === "admin"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}>
                  {user.role === "super_admin" ? "Super Admin" : 
                   user.role === "admin" ? "Admin" : "User"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center mb-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Sign up for an account or log in to access your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/register">
                <Button className="w-full" size="lg">
                  Create Account
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="w-full" size="lg">
                  Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8 mt-16">
        <div className="text-center">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Secure Authentication</h3>
          <p className="text-gray-600">
            JWT-based authentication with Google OAuth integration for secure access.
          </p>
        </div>

        <div className="text-center">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Role-Based Access</h3>
          <p className="text-gray-600">
            Granular permissions with User, Admin, and Super Admin roles.
          </p>
        </div>

        <div className="text-center">
          <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">User Management</h3>
          <p className="text-gray-600">
            Complete CRUD operations with search, pagination, and profile management.
          </p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
