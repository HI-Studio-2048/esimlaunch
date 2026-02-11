import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { 
  MessageSquare, Send, Loader2, ArrowLeft, 
  CheckCircle2, Clock, AlertCircle, User
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const priorityColors: Record<string, string> = {
  low: "bg-gray-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-500",
  in_progress: "bg-yellow-500",
  resolved: "bg-green-500",
  closed: "bg-gray-500",
};

export default function SupportTicket() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customer, isAuthenticated } = useCustomerAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load ticket data
  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  const loadTicket = async () => {
    setIsLoading(true);
    try {
      const token = isAuthenticated ? localStorage.getItem('customer_token') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        headers,
      });

      const result = await response.json();
      if (result.success) {
        setTicket(result.data);
        setMessages(result.data.messages || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load ticket",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSubmitting(true);
    try {
      const token = isAuthenticated ? localStorage.getItem('customer_token') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: newMessage }),
      });

      const result = await response.json();
      if (result.success) {
        setNewMessage("");
        loadTicket(); // Reload to get updated messages
        toast({
          title: "Message Sent",
          description: "Your message has been sent successfully.",
        });
      } else {
        throw new Error(result.errorMessage || 'Failed to send message');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Ticket not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Ticket Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
                  <Badge className={statusColors[ticket.status] || "bg-gray-500"}>
                    {ticket.status}
                  </Badge>
                  <Badge className={priorityColors[ticket.priority] || "bg-gray-500"}>
                    {ticket.priority}
                  </Badge>
                </div>
                <CardDescription>
                  Ticket #{ticket.ticketNumber} • Created {new Date(ticket.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{ticket.description}</p>
              </div>
              {ticket.category && (
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-muted-foreground mt-1 capitalize">{ticket.category}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.senderType === 'customer' ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  <div className={`flex-1 ${
                    message.senderType === 'customer' ? 'text-left' : 'text-right'
                  }`}>
                    <div className={`inline-block p-4 rounded-lg ${
                      message.senderType === 'customer'
                        ? 'bg-muted'
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {message.senderName || message.senderEmail}
                        </span>
                        <span className="text-xs opacity-70">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{message.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reply Form */}
        {ticket.status !== 'closed' && (
          <Card>
            <CardHeader>
              <CardTitle>Reply</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="message">Your Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Type your message here..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={isSubmitting || !newMessage.trim()}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

