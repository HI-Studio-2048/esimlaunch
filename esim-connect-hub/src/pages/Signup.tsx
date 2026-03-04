import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, Building, Globe, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { useSignUp, useUser, useClerk } from "@clerk/clerk-react";
import { getPostAuthRedirectPath } from "@/lib/authRedirect";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    password: "",
    confirmPassword: "",
  });

  // Read referral code from URL ?ref=CODE
  const referralCode = useRef<string | null>(
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') : null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, setUser, isLoading, error, isAuthenticated, clearError } = useAuth();
  const [oauthLoading, setOauthLoading] = useState(false);
  const { signUp, setActive, isLoaded: isClerkLoaded } = useSignUp();

  // Redirect if already authenticated: new → onboarding, returning → dashboard
  useEffect(() => {
    if (!isAuthenticated) return;
    getPostAuthRedirectPath().then((path) => navigate(path, { replace: true }));
  }, [isAuthenticated, navigate]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If we've already created the Clerk sign-up and are waiting for the email code,
    // treat this submit as "verify code and finish".
    if (awaitingVerification) {
      if (!verificationCode || verificationCode.length < 4) {
        toast({
          title: "Verification code required",
          description: "Enter the code we emailed to you.",
          variant: "destructive",
        });
        return;
      }

      if (!(clerkPubKey && isClerkLoaded && signUp)) {
        toast({
          title: "Verification unavailable",
          description: "Authentication is still loading. Please try again in a moment.",
          variant: "destructive",
        });
        return;
      }

      try {
        setIsVerifying(true);
        const updated = await signUp.attemptEmailAddressVerification({
          code: verificationCode,
        });

        if (updated.status === "complete" && updated.createdSessionId && updated.createdUserId) {
          await setActive({ session: updated.createdSessionId });
          const result = await apiClient.clerkSync(updated.createdUserId);
          if (result?.merchant) {
            setUser(result.merchant);
            if (result.token) apiClient.setJwtToken(result.token);
          }
          toast({
            title: "Email verified!",
            description: "Your account is ready. Welcome to eSIMLaunch.",
          });
          navigate("/onboarding", { replace: true });
          return;
        }

        toast({
          title: "Verification failed",
          description: "The code was not accepted. Please check it and try again.",
          variant: "destructive",
        });
        return;
      } catch (err: any) {
        const errorMessage =
          err?.errors?.[0]?.longMessage ||
          err?.message ||
          "Invalid or expired verification code. Please request a new one.";
        toast({
          title: "Verification failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      } finally {
        setIsVerifying(false);
      }
    }

    // Normal initial sign-up submit
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (!agreeTerms) {
      toast({
        title: "Terms required",
        description: "Please agree to the terms and conditions.",
        variant: "destructive",
      });
      return;
    }

    clearError();
    localStorage.removeItem("explicit_logout");
    sessionStorage.removeItem("explicit_logout");

    try {
      // When Clerk is configured, create the user in Clerk (email/password) so they're stored there too.
      // Then either sign them in directly (no verification) or start the email-code verification flow.
      if (clerkPubKey && isClerkLoaded && signUp) {
        const nameParts = (formData.fullName || "").trim().split(/\s+/);
        const firstName = nameParts[0] || undefined;
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

        const created = await signUp.create({
          emailAddress: formData.email,
          password: formData.password,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        });

        // If Clerk does not require additional steps, sign in immediately.
        if (created.status === "complete" && created.createdSessionId && created.createdUserId) {
          await setActive({ session: created.createdSessionId });
          const result = await apiClient.clerkSync(created.createdUserId);
          if (result?.merchant) {
            setUser(result.merchant);
            if (result.token) apiClient.setJwtToken(result.token);
          }
          toast({
            title: "Account created!",
            description: "Welcome to eSIMLaunch. You're signed in.",
          });
          navigate("/onboarding", { replace: true });
          return;
        }

        // Most common path with your current settings:
        // email must be verified via a one-time code.
        if (
          created.status === "missing_requirements" &&
          created.unverifiedFields?.includes("email_address")
        ) {
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
          setAwaitingVerification(true);
          toast({
            title: "Check your email",
            description: "We sent you a verification code. Enter it below to finish sign-up.",
          });
          return;
        }

        toast({
          title: "Sign-up incomplete",
          description: "Please complete any required steps or try again.",
          variant: "destructive",
        });
        return;
      }

      // No Clerk: use backend-only registration (session cookie + Merchant in DB)
      await register(
        formData.email,
        formData.password,
        formData.fullName || undefined,
        "ADVANCED",
        referralCode.current || undefined
      );
      toast({
        title: "Account created!",
        description: "Welcome to eSIMLaunch. Let's get started.",
      });
      navigate("/onboarding", { replace: true });
    } catch (err: any) {
      const errorMessage =
        err?.message || error || "Registration failed. Please try again.";
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSocialSignup = async (e: React.MouseEvent, provider: 'google' | 'apple') => {
    e.preventDefault();
    e.stopPropagation();

    if (provider === 'apple') {
      toast({ title: "Coming Soon", description: "Apple signup will be available soon." });
      return;
    }

    if (!clerkPubKey) {
      toast({
        title: "Authentication unavailable",
        description: "Clerk authentication is not configured. Please use email signup.",
        variant: "destructive",
      });
      return;
    }

    if (!isClerkLoaded || !signUp) {
      toast({ title: "Loading...", description: "Please wait while authentication loads." });
      return;
    }

    if (oauthLoading) return;
    setOauthLoading(true);

    // Clear the explicit logout flag — user is actively signing up
    localStorage.removeItem('explicit_logout');
    sessionStorage.removeItem('explicit_logout');

    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/`,
      });
      // Note: page will redirect — setOauthLoading(false) is not needed here
    } catch (err: any) {
      console.error('OAuth signup error:', err);
      setOauthLoading(false);
      toast({
        title: "Signup failed",
        description: err?.message || "Failed to start Google sign-up. Please try again.",
        variant: "destructive",
      });
    }
  };

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = passwordStrength(formData.password);
  const strengthColors = ["bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/5">
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gradient-to-r from-secondary/10 to-primary/10 blur-3xl"
              style={{
                width: `${250 + i * 80}px`,
                height: `${250 + i * 80}px`,
                right: `${5 + i * 12}%`,
                top: `${5 + i * 12}%`,
              }}
              animate={{
                x: [0, -20, 0],
                y: [0, 20, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      </div>

      {/* Left Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="glass rounded-2xl p-8 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Create your account</h2>
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>

            {/* Social Signup Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={oauthLoading}
                onClick={(e) => handleSocialSignup(e, "google")}
              >
                {oauthLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {oauthLoading ? 'Redirecting...' : 'Google'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={(e) => handleSocialSignup(e, "apple")}
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Apple
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company name (optional)</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    placeholder="Acme Inc."
                    value={formData.company}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i < strength ? strengthColors[strength - 1] : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password strength: {strength > 0 ? strengthLabels[strength - 1] : "Enter a password"}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    required
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

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreeTerms}
                  onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                  className="mt-1"
                />
                <Label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </Label>
              </div>

              {error && !awaitingVerification && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {awaitingVerification && (
                <div className="space-y-2">
                  <Label htmlFor="verificationCode" className="text-sm">
                    Email verification code
                  </Label>
                  <Input
                    id="verificationCode"
                    placeholder="Enter the 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="font-mono tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground">
                    We sent a one-time code to <span className="font-medium">{formData.email}</span>. Enter it
                    here to activate your account.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                variant="gradient"
                disabled={isLoading || isVerifying}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                  />
                ) : isVerifying ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                  />
                ) : (
                  awaitingVerification ? "Verify email & continue" : "Create account"
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
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
            Start selling eSIMs{" "}
            <span className="gradient-text">quickly</span>
          </h1>
          
          <p className="text-muted-foreground text-lg mb-8">
            Join thousands of businesses worldwide who trust eSIMLaunch to power their connectivity solutions.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { value: "10K+", label: "Active Users" },
              { value: "190+", label: "Countries" },
              { value: "99.9%", label: "Uptime" },
              { value: "24/7", label: "Support" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="glass rounded-xl p-4 text-center"
              >
                <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background"
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">1,200+</span> businesses joined this month
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
