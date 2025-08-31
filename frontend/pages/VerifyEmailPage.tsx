import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import backend from "~backend/client";

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      
      if (!token) {
        setError("Invalid verification link.");
        setIsLoading(false);
        return;
      }

      try {
        await backend.user.verifyEmail({ token });
        setIsVerified(true);
        toast({
          title: "Success",
          description: "Email verified successfully! You can now log in.",
        });
      } catch (error: any) {
        console.error("Email verification error:", error);
        setError(error.message || "Failed to verify email. The link may be invalid or expired.");
        toast({
          title: "Error",
          description: error.message || "Failed to verify email.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, toast]);

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Verifying your email...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {isVerified ? (
              <CheckCircle className="w-16 h-16 text-green-600" />
            ) : (
              <XCircle className="w-16 h-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isVerified ? "Email Verified!" : "Verification Failed"}
          </CardTitle>
          <CardDescription>
            {isVerified
              ? "Your email has been successfully verified."
              : error || "There was a problem verifying your email."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {isVerified ? (
            <p className="text-sm text-gray-600">
              You can now log in to your account and access all features.
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Please try requesting a new verification email or contact support if the problem persists.
            </p>
          )}
          
          <div className="space-y-2">
            <Link to="/login">
              <Button className="w-full">
                {isVerified ? "Go to Login" : "Try Login"}
              </Button>
            </Link>
            
            {!isVerified && (
              <Link to="/register">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Register
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default VerifyEmailPage;
