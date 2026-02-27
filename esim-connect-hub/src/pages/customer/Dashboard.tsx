import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { 
  Package, Mail, Calendar, DollarSign, Loader2, 
  CheckCircle2, Clock, XCircle, LogOut, Settings
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pending", color: "bg-yellow-500", icon: Clock },
  PROCESSING: { label: "Processing", color: "bg-blue-500", icon: Clock },
  COMPLETED: { label: "Completed", color: "bg-green-500", icon: CheckCircle2 },
  FAILED: { label: "Failed", color: "bg-red-500", icon: XCircle },
  CANCELLED: { label: "Cancelled", color: "bg-gray-500", icon: XCircle },
};

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customer, logout, isLoading: authLoading } = useCustomerAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !customer) {
      navigate('/customer/login');
      return;
    }
    if (customer) {
      loadOrders();
    }
  }, [customer, authLoading, navigate]);

  const loadOrders = async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) return;

    setIsLoading(true);
    try {
      const ordersResponse = await fetch(`${API_BASE_URL}/api/customers/me/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const ordersResult = await ordersResponse.json();
      if (ordersResult.success) {
        setOrders(ordersResult.data);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Account</h1>
            <p className="text-muted-foreground">
              Welcome back, {customer?.name || customer?.email}!
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/customer/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active eSIMs</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.status === 'COMPLETED').length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">
                    ${orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>
              View and manage your eSIM orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No orders yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your orders will appear here once you make a purchase.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const statusInfo = statusConfig[order.status] || statusConfig.PENDING;
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <motion.div
                      key={order.id}
                      whileHover={{ scale: 1.01 }}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/order-tracking?orderId=${order.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={`${statusInfo.color} text-white`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                            <span className="text-sm text-muted-foreground font-mono">
                              {order.id.substring(0, 8)}...
                            </span>
                          </div>
                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Date</p>
                              <p className="font-medium">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Packages</p>
                              <p className="font-medium">{order.packageCount}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Amount</p>
                              <p className="font-medium">${order.totalAmount?.toFixed(2) || "0.00"}</p>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          View Details →
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

