import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
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
import { User, Lock, Trash2, Eye, EyeOff, Save, Mail, CheckCircle, XCircle, Shield, Monitor, LogOut, Loader2, Globe, Webhook, CreditCard, FileText, Key, Plus, Copy } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { DomainConfiguration } from "@/components/shared/DomainConfiguration";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Wait for authentication before loading data
  useEffect(() => {
    const loadAllData = async () => {
      // Ensure ApiClient has the latest token
      const token = localStorage.getItem('jwt_token');
      if (token) {
        apiClient.setJwtToken(token);
      }

      // Load 2FA status
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

      // Load sessions
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

      // Load stores
      const loadStores = async () => {
        try {
          const storesData = await apiClient.listStores();
          setStores(storesData);
          if (storesData.length > 0) {
            setSelectedStore(storesData[0]);
          }
        } catch (err) {
          console.error('Failed to load stores:', err);
        } finally {
          setIsLoadingStores(false);
        }
      };

      // Load API keys
      const loadApiKeys = async () => {
        try {
          const apiKeysData = await apiClient.listApiKeys();
          // Filter out inactive (revoked) keys
          const activeKeys = apiKeysData.filter(key => key.isActive !== false);
          setApiKeys(activeKeys);
        } catch (err) {
          console.error('Failed to load API keys:', err);
        } finally {
          setIsLoadingApiKeys(false);
        }
      };

      // Load all data in parallel
      await Promise.all([
        load2FAStatus(),
        loadSessions(),
        loadStores(),
        loadApiKeys(),
      ]);
    };

    // Wait for user to be set (from ClerkAuthSync)
    if (!user) {
      // Poll for user and token
      const checkAuth = setInterval(() => {
        const token = localStorage.getItem('jwt_token');
        // Check if user was set (re-read from closure)
        const hasUser = user !== null;
        if (token) {
          clearInterval(checkAuth);
          // ApiClient will automatically use token from localStorage
          loadAllData();
        }
      }, 200);
      
      setTimeout(() => clearInterval(checkAuth), 10000);
      return () => clearInterval(checkAuth);
    }

    // User exists, check for token
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      // Wait for token
      const checkToken = setInterval(() => {
        const newToken = localStorage.getItem('jwt_token');
        if (newToken) {
          clearInterval(checkToken);
          // ApiClient will automatically use token from localStorage
          loadAllData();
        }
      }, 200);
      
      setTimeout(() => clearInterval(checkToken), 10000);
      return () => clearInterval(checkToken);
    }

    // Both user and token exist, load data
    // ApiClient will automatically use token from localStorage
    loadAllData();
  }, [user]);

  const handleDomainUpdate = async () => {
    // Reload stores after domain update
    try {
      const storesData = await apiClient.listStores();
      setStores(storesData);
      if (storesData.length > 0) {
        const updatedStore = storesData.find(s => s.id === selectedStore?.id) || storesData[0];
        setSelectedStore(updatedStore);
      }
    } catch (err) {
      console.error('Failed to reload stores:', err);
    }
  };

  // API Key handlers
  const handleCreateApiKey = async () => {
    try {
      const result = await apiClient.createApiKey(newApiKeyName || undefined);
      setNewApiKey(result.key);
      setApiKeys([result, ...apiKeys]);
      setNewApiKeyName("");
      
      // Automatically store the API key in localStorage so it can be used immediately
      if (result.key) {
        localStorage.setItem('api_key', result.key);
        apiClient.setApiKey(result.key);
        
        // Dispatch event to notify other components that API key is now available
        window.dispatchEvent(new CustomEvent('apiKeyCreated'));
      }
      
      toast({
        title: "API Key Created",
        description: "Your new API key has been generated and saved. Copy it now - you won't be able to see it again!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create API key",
        variant: "destructive",
      });
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (!keyId) return;
    
    try {
      // Find the key being revoked to check if it's the one in localStorage
      const keyToRevokeObj = apiKeys.find(key => key.id === keyId);
      
      await apiClient.revokeApiKey(keyId);
      
      // If the revoked key matches the one in localStorage, remove it
      if (keyToRevokeObj && typeof window !== 'undefined') {
        const storedApiKey = localStorage.getItem('api_key');
        // Check if the stored key starts with the same prefix
        if (storedApiKey && storedApiKey.startsWith(keyToRevokeObj.keyPrefix)) {
          localStorage.removeItem('api_key');
          apiClient.setApiKey(null);
        }
      }
      
      // Reload the API keys list from the backend to ensure we have the latest state
      try {
        const updatedKeys = await apiClient.listApiKeys();
        // Filter out inactive (revoked) keys
        const activeKeys = updatedKeys.filter(key => key.isActive !== false);
        setApiKeys(activeKeys);
      } catch (reloadError) {
        console.error('Failed to reload API keys after deletion:', reloadError);
        // If reload fails, just remove from local state
        setApiKeys(prevKeys => prevKeys.filter(key => key.id !== keyId));
      }
      
      setKeyToRevoke(null); // Close dialog
      
      toast({
        title: "API Key Revoked",
        description: "The API key has been successfully revoked",
      });
    } catch (error: any) {
      console.error('Failed to revoke API key:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to revoke API key",
        variant: "destructive",
      });
      setKeyToRevoke(null); // Close dialog even on error
    }
  };

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
    });
  };

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

  // Store/Domain state
  const [stores, setStores] = useState<any[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(true);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState("");
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);

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

          {/* Settings Navigation Cards */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/settings/webhooks")}
              className={`bg-card rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all duration-300 text-left border ${
                location.pathname === "/settings/webhooks"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Webhook className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Webhooks</h3>
              <p className="text-sm text-muted-foreground">Configure webhook endpoints</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/settings/billing")}
              className={`bg-card rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all duration-300 text-left border ${
                location.pathname === "/settings/billing"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Billing</h3>
              <p className="text-sm text-muted-foreground">Manage subscription and invoices</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/settings/email-templates")}
              className={`bg-card rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all duration-300 text-left border ${
                location.pathname === "/settings/email-templates"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Email Templates</h3>
              <p className="text-sm text-muted-foreground">Customize email templates</p>
            </motion.button>
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

          {/* Domain Configuration */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <CardTitle>Domain Configuration</CardTitle>
              </div>
              <CardDescription>
                Configure your custom domain and subdomain settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStores ? (
                <div className="text-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                </div>
              ) : stores.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    No stores found. Create a store first to configure domain settings.
                  </p>
                  <Link to="/onboarding">
                    <Button variant="gradient" size="sm">
                      Create Store
                    </Button>
                  </Link>
                </div>
              ) : (
                <DomainConfiguration
                  storeId={selectedStore?.id}
                  currentDomain={selectedStore?.domain}
                  currentSubdomain={selectedStore?.subdomain}
                  onUpdate={handleDomainUpdate}
                />
              )}
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

          {/* API Keys Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    API Keys
                  </CardTitle>
                  <CardDescription>
                    Manage your API keys for programmatic access to the eSIM Access API
                  </CardDescription>
                </div>
                <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
                  <DialogTrigger asChild>
                    <Button variant="gradient" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New API Key</DialogTitle>
                      <DialogDescription>
                        Give your API key a name to help you identify it later.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="key-name">Key Name (Optional)</Label>
                        <Input
                          id="key-name"
                          value={newApiKeyName}
                          onChange={(e) => setNewApiKeyName(e.target.value)}
                          placeholder="e.g., Production API Key"
                        />
                      </div>
                      {newApiKey && (
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-2">Your API Key (copy this now):</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 p-2 bg-background rounded text-sm font-mono break-all overflow-wrap-anywhere min-w-0">
                              {newApiKey}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyApiKey(newApiKey)}
                              className="shrink-0"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            This key will not be shown again. Make sure to save it securely.
                          </p>
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowApiKeyDialog(false);
                            setNewApiKey(null);
                            setNewApiKeyName("");
                          }}
                        >
                          {newApiKey ? "Close" : "Cancel"}
                        </Button>
                        {!newApiKey && (
                          <Button onClick={handleCreateApiKey}>
                            Create Key
                          </Button>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingApiKeys ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No API keys yet. Create your first one to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Key className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {key.name || "Unnamed Key"}
                            </div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {key.keyPrefix}...
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Created {new Date(key.createdAt).toLocaleDateString()} • 
                          Rate limit: {key.rateLimit}/min
                          {key.lastUsedAt && ` • Last used: ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                        </div>
                      </div>
                      <AlertDialog open={keyToRevoke === key.id} onOpenChange={(open) => {
                        if (!open) setKeyToRevoke(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setKeyToRevoke(key.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to revoke this API key? This action cannot be undone.
                              {key.name && ` The key "${key.name}" will no longer work.`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setKeyToRevoke(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRevokeApiKey(key.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Revoke Key
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
                  <AlertDialog onOpenChange={(open) => {
                    if (open) {
                      // Close API Key dialog if it's open
                      setShowApiKeyDialog(false);
                    }
                  }}>
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

