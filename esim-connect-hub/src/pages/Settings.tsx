import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, ApiError } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User, Lock, Trash2, Eye, EyeOff, Save, Mail, CheckCircle, XCircle, Shield, Monitor, LogOut, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Load 2FA status on mount
  useEffect(() => {
    const load2FAStatus = async () => {
      try {
        const status = await apiClient.get2FAStatus();
        setTwoFAEnabled(status.enabled);
      } catch (err) {
        console.error('Failed to load 2FA status:', err);
      } finally {
        setIsLoading2FAStatus(false);
      }
    };

    load2FAStatus();
  }, []);

  // Load sessions on mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const sessionsData = await apiClient.getSessions();
        setSessions(sessionsData);
      } catch (err) {
        console.error('Failed to load sessions:', err);
      } finally {
        setIsLoadingSessions(false);
      }
    };

    loadSessions();
  }, []);

  // Profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete account state
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Email verification state
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [isLoading2FAStatus, setIsLoading2FAStatus] = useState(true);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<Array<{
    id: string;
    ipAddress: string | null;
    userAgent: string | null;
    expiresAt: string;
    createdAt: string;
    lastUsedAt: string;
  }>>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isDeletingSession, setIsDeletingSession] = useState<string | null>(null);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      await apiClient.updateProfile(profileData.name || undefined, profileData.email);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      // Refresh user data
      window.location.reload(); // Simple refresh, could be improved with context update
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to update profile. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your new passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      await apiClient.changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to change password. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);

    try {
      await apiClient.deleteAccount();
      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully.",
      });
      logout();
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to delete account. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResendingVerification(true);
    try {
      await apiClient.resendVerificationEmail();
      toast({
        title: "Verification email sent",
        description: "Please check your email for the verification link.",
      });
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to resend verification email. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleDisable2FA = async () => {
    setIsDisabling2FA(true);
    try {
      await apiClient.disable2FA();
      setTwoFAEnabled(false);
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled for your account.",
      });
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to disable 2FA. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDisabling2FA(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    setIsDeletingSession(sessionId);
    try {
      await apiClient.deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      toast({
        title: "Session revoked",
        description: "The session has been revoked successfully.",
      });
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to revoke session. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeletingSession(null);
    }
  };

  const handleDeleteAllSessions = async () => {
    try {
      await apiClient.deleteAllSessions();
      setSessions([]);
      toast({
        title: "All sessions revoked",
        description: "All other sessions have been revoked. You will need to log in again on other devices.",
      });
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to revoke sessions. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const formatUserAgent = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown';
    // Simple parsing - can be improved
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container-custom py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Profile Settings */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <CardTitle>Profile Information</CardTitle>
              </div>
              <CardDescription>
                Update your profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      placeholder="your@email.com"
                      className="flex-1"
                    />
                    {user?.emailVerified === false && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResendVerification}
                        disabled={isResendingVerification}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {isResendingVerification ? "Sending..." : "Verify"}
                      </Button>
                    )}
                    {user?.emailVerified === true && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs">Verified</span>
                      </div>
                    )}
                  </div>
                  {user?.emailVerified === false && (
                    <p className="text-xs text-muted-foreground">
                      Please verify your email address. Check your inbox for the verification link.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Input
                    value={user?.serviceType || "ADVANCED"}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Service type cannot be changed
                  </p>
                </div>
                <Button type="submit" variant="gradient" disabled={isSavingProfile}>
                  {isSavingProfile ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 2FA Settings */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <CardTitle>Two-Factor Authentication</CardTitle>
              </div>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading2FAStatus ? (
                <div className="text-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                </div>
              ) : twoFAEnabled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">2FA is enabled</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your account is protected with two-factor authentication. You'll need to enter a verification code from your authenticator app when logging in.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDisable2FA}
                    disabled={isDisabling2FA}
                  >
                    {isDisabling2FA ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Disabling...
                      </>
                    ) : (
                      "Disable 2FA"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Two-factor authentication adds an extra layer of security to your account by requiring a verification code from your authenticator app in addition to your password.
                  </p>
                  <Link to="/2fa/setup">
                    <Button variant="gradient">
                      <Shield className="w-4 h-4 mr-2" />
                      Enable 2FA
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Password Settings */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                <CardTitle>Change Password</CardTitle>
              </div>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Enter new password"
                      className="pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" variant="gradient" disabled={isChangingPassword}>
                  {isChangingPassword ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-primary" />
                  <CardTitle>Active Sessions</CardTitle>
                </div>
                {sessions.length > 1 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Revoke All Others
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke All Other Sessions?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will log you out from all other devices. You will remain logged in on this device.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAllSessions}>
                          Revoke All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              <CardDescription>
                Manage your active login sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="text-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active sessions found.
                </p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Monitor className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">
                            {formatUserAgent(session.userAgent)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.ipAddress || 'Unknown IP'} • Last used: {new Date(session.lastUsedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSession(session.id)}
                        disabled={isDeletingSession === session.id}
                      >
                        {isDeletingSession === session.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <LogOut className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-destructive" />
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </div>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Delete Account</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={isDeletingAccount}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove all associated data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeletingAccount ? "Deleting..." : "Delete Account"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

