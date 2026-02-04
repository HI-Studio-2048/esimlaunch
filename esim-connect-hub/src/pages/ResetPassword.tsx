import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff, X } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidToken(false);
        setIsValidating(false);
        return;
      }

      try {
        const result = await apiClient.verifyResetToken(token);
        setIsValidToken(result.valid);
      } catch (err) {
        setIsValidToken(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    if (!token) {
      toast({
        title: "Invalid token",
        description: "Reset token is missing.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.resetPassword(token, password);
      setIsSubmitted(true);
      toast({
        title: "Password reset successful!",
        description: "Your password has been reset. You can now log in.",
      });
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to reset password. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Validating reset token...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken || !token) {
    return (
      <div className="min-h-screen bg-background flex relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5">
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 blur-3xl"
                style={{
                  width: `${300 + i * 100}px`,
                  height: `${300 + i * 100}px`,
                  left: `${10 + i * 15}%`,
                  top: `${10 + i * 10}%`,
                }}
                animate={{
                  x: [0, 30, 0],
                  y: [0, -30, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 10 + i * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5,
                }}
              />
            ))}
          </div>
        </div>

        <div className="w-full flex items-center justify-center p-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md glass rounded-2xl p-8 shadow-xl text-center"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Invalid or Expired Token</h2>
            <p className="text-muted-foreground mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link to="/forgot-password">
              <Button variant="gradient" className="w-full">
                Request New Reset Link
              </Button>
            </Link>
            <div className="mt-4">
              <Link to="/login" className="text-sm text-primary hover:underline">
                Back to login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex relative overflow-hidden pt-20">
        <div className="w-full flex items-center justify-center p-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass rounded-2xl p-8 shadow-xl text-center"
          >
            <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Password Reset Successful!</h2>
            <p className="text-muted-foreground mb-6">
              Your password has been reset successfully. Redirecting to login...
            </p>
            <Link to="/login">
              <Button variant="gradient" className="w-full">
                Go to Login
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden pt-20">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 blur-3xl"
              style={{
                width: `${300 + i * 100}px`,
                height: `${300 + i * 100}px`,
                left: `${10 + i * 15}%`,
                top: `${10 + i * 10}%`,
              }}
              animate={{
                x: [0, 30, 0],
                y: [0, -30, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}
        </div>
      </div>

      <div className="w-full flex items-center justify-center p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md glass rounded-2xl p-8 shadow-xl"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Reset Your Password</h2>
            <p className="text-muted-foreground">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" variant="gradient" disabled={isLoading}>
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                />
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;

