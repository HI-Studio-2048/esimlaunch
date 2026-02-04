import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Globe, ArrowLeft, CheckCircle } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await apiClient.forgotPassword(email);
      setIsSubmitted(true);
      toast({
        title: "Reset link sent!",
        description: "Check your email for password reset instructions.",
      });
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to send reset email. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden pt-20">
      {/* Animated Background */}
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

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
              <Globe className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold gradient-text">eSIMLaunch</span>
          </Link>
          
          <h1 className="text-4xl font-bold mb-4">
            Reset your{" "}
            <span className="gradient-text">password</span>
          </h1>
          
          <p className="text-muted-foreground text-lg mb-8">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <div className="space-y-4">
            {[
              "Secure password reset",
              "Email verification",
              "Quick account recovery",
            ].map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center">
                  <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-foreground">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Side - Reset Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="glass rounded-2xl p-8 shadow-xl">
            {!isSubmitted ? (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Forgot your password?</h2>
                  <p className="text-muted-foreground">
                    No worries! Enter your email and we'll send you reset instructions.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
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
                      "Send reset link"
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
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Check your email</h2>
                <p className="text-muted-foreground mb-6">
                  We've sent password reset instructions to <span className="font-medium text-foreground">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={() => setIsSubmitted(false)} 
                    variant="outline" 
                    className="w-full"
                  >
                    Resend email
                  </Button>
                  <Link to="/login">
                    <Button variant="ghost" className="w-full">
                      Back to login
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;

