import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Loader2, Package, Mail, Calendar, DollarSign, 
  CheckCircle2, Clock, XCircle, AlertCircle, QrCode, Download, Copy, Smartphone
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pending", color: "bg-yellow-500", icon: Clock },
  PROCESSING: { label: "Processing", color: "bg-blue-500", icon: Clock },
  COMPLETED: { label: "Completed", color: "bg-green-500", icon: CheckCircle2 },
  FAILED: { label: "Failed", color: "bg-red-500", icon: XCircle },
  CANCELLED: { label: "Cancelled", color: "bg-gray-500", icon: XCircle },
};

export default function OrderTracking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [searchType, setSearchType] = useState<"orderId" | "email">("orderId");
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    // Check if we have payment intent ID from checkout
    const state = location.state as any;
    if (state?.paymentIntentId) {
      loadOrderByPaymentIntent(state.paymentIntentId);
    }
  }, [location]);

  const loadOrderByPaymentIntent = async (paymentIntentId: string) => {
    setIsLoading(true);
    try {
      const orderData = await apiClient.getCustomerOrderByPaymentIntent(paymentIntentId);
      setOrder(orderData);
      setSearchValue(orderData.id);
      setSearchType("orderId");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter an order ID or email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (searchType === "orderId") {
        const orderData = await apiClient.getCustomerOrder(searchValue);
        setOrder(orderData);
        setOrders([]);
      } else {
        const ordersData = await apiClient.getCustomerOrdersByEmail(searchValue);
        setOrders(ordersData);
        setOrder(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to find orders",
        variant: "destructive",
      });
      setOrder(null);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
          <p className="text-muted-foreground">
            Enter your order ID or email address to track your eSIM order
          </p>
        </motion.div>

        {/* Search Form */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={searchType === "orderId" ? "default" : "outline"}
                  onClick={() => setSearchType("orderId")}
                  size="sm"
                >
                  Order ID
                </Button>
                <Button
                  variant={searchType === "email" ? "default" : "outline"}
                  onClick={() => setSearchType("email")}
                  size="sm"
                >
                  Email
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={searchType === "orderId" ? "Enter order ID" : "Enter email address"}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && !order && orders.length === 0 && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Searching for orders...</p>
          </div>
        )}

        {/* Single Order Display */}
        {order && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Order Details</CardTitle>
                    <CardDescription>Order ID: {order.id}</CardDescription>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{order.customerEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Order Date</p>
                      <p className="font-medium">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Packages</p>
                      <p className="font-medium">{order.packageCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="font-medium">${order.totalAmount?.toFixed(2) || "0.00"}</p>
                    </div>
                  </div>
                </div>

                {order.store && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-1">Store</p>
                    <p className="font-medium">{order.store.businessName || order.store.name}</p>
                  </div>
                )}

                {order.esimAccessOrderNo && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-1">eSIM Access Order</p>
                    <p className="font-medium font-mono">{order.esimAccessOrderNo}</p>
                  </div>
                )}

                {order.status === "COMPLETED" && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <p className="font-medium text-green-900 dark:text-green-100">
                          Order Completed
                        </p>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Your eSIM QR code has been sent to your email address. 
                        Please check your inbox and spam folder.
                      </p>
                    </div>

                    {/* QR Codes Display */}
                    {order.qrCodes && order.qrCodes.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <QrCode className="h-5 w-5" />
                          Your eSIM QR Codes
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {order.qrCodes.map((qrCode: string, index: number) => {
                            const profile = order.profiles?.[index];
                            return (
                              <Card key={index}>
                                <CardContent className="pt-6">
                                  <div className="text-center space-y-3">
                                    {profile && (
                                      <div>
                                        <p className="font-medium">
                                          eSIM {index + 1}
                                          {profile.data && ` - ${profile.data}`}
                                        </p>
                                        {profile.validity && (
                                          <p className="text-sm text-muted-foreground">
                                            Valid for {profile.validity}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    <img
                                      src={qrCode}
                                      alt={`QR Code ${index + 1}`}
                                      className="mx-auto border-2 border-border rounded-lg p-2 bg-white max-w-[250px]"
                                    />
                                    <div className="flex gap-2 justify-center">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const link = document.createElement('a');
                                          link.href = qrCode;
                                          link.download = `esim-qr-${index + 1}.png`;
                                          link.click();
                                        }}
                                      >
                                        <Download className="h-4 w-4 mr-1" />
                                        Download
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>

                        {/* Installation Instructions */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Smartphone className="h-5 w-5" />
                              How to Install Your eSIM
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ol className="list-decimal list-inside space-y-2 text-sm">
                              <li>Open your phone's Settings app</li>
                              <li>Go to Cellular/Mobile Data (iPhone) or Network & Internet (Android)</li>
                              <li>Tap "Add Cellular Plan" or "Add eSIM"</li>
                              <li>Scan the QR code above with your phone's camera</li>
                              <li>Follow the on-screen instructions to complete setup</li>
                            </ol>
                            <p className="text-xs text-muted-foreground mt-4">
                              <strong>Note:</strong> Your eSIM will activate automatically when you arrive at your destination and connect to a local network.
                            </p>
                          </CardContent>
                        </Card>

                        {/* Resend Email Button */}
                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            onClick={async () => {
                              setIsResending(true);
                              try {
                                await apiClient.resendESIMEmail(order.id);
                                toast({
                                  title: "Email Sent",
                                  description: "Your eSIM QR code has been resent to your email address.",
                                });
                              } catch (error: any) {
                                toast({
                                  title: "Error",
                                  description: error.message || "Failed to resend email",
                                  variant: "destructive",
                                });
                              } finally {
                                setIsResending(false);
                              }
                            }}
                            disabled={isResending}
                          >
                            {isResending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Mail className="h-4 w-4 mr-2" />
                                Resend Email
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {order.status === "FAILED" && (
                  <div className="border-t pt-4">
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <p className="font-medium text-red-900 dark:text-red-100">
                          Order Failed
                        </p>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        There was an error processing your order. Please contact support for assistance.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Multiple Orders Display */}
        {orders.length > 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold">Your Orders</h2>
            {orders.map((orderItem) => (
              <Card key={orderItem.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium">Order {orderItem.id.substring(0, 8)}...</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(orderItem.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={orderItem.status} />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Packages</p>
                      <p className="font-medium">{orderItem.packageCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-medium">${orderItem.totalAmount?.toFixed(2) || "0.00"}</p>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchType("orderId");
                          setSearchValue(orderItem.id);
                          handleSearch();
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* No Results */}
        {!isLoading && !order && orders.length === 0 && searchValue && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please check your order ID or email address and try again.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

