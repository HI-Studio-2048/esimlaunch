import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Loader2,
  Search,
  ChevronRight,
  Mail,
  Shield,
  ArrowLeft,
  Store,
  CreditCard,
  MessageSquare,
} from "lucide-react";

const ADMIN_EMAIL = "admin@esimlaunch.com";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminMerchants() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const isAdmin =
    user?.role === "ADMIN" ||
    user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    } else if (!authLoading && isAuthenticated && !isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  const fetchMerchants = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.getAdminMerchants({ search: search || undefined, limit: 100 });
      setMerchants(res ?? []);
      setTotal((res ?? []).length);
    } catch (e: any) {
      setError(e?.message || "Failed to load merchants");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, search]);

  useEffect(() => { fetchMerchants(); }, [fetchMerchants]);

  const handleSearch = () => setSearch(searchInput.trim());

  if (authLoading || (!user && isAuthenticated)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Admin
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Merchant Directory</h1>
            <p className="text-muted-foreground text-sm">{total} merchants total</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2 max-w-md">
        <Input
          placeholder="Search by email or name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button variant="outline" onClick={handleSearch}>
          <Search className="w-4 h-4" />
        </Button>
        {search && (
          <Button variant="ghost" onClick={() => { setSearch(""); setSearchInput(""); }}>
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="text-destructive text-sm p-6">{error}</p>
        ) : merchants.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-12">No merchants found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground bg-muted/30">
                  <th className="py-3 px-4 font-medium">Merchant</th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium text-center">Stores</th>
                  <th className="py-3 px-4 font-medium text-center">Orders</th>
                  <th className="py-3 px-4 font-medium">Plan</th>
                  <th className="py-3 px-4 font-medium">Joined</th>
                  <th className="py-3 px-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((m: any) => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {m.role === "ADMIN" && (
                          <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <a href={`mailto:${m.email}`} className="text-primary hover:underline truncate">
                              {m.email}
                            </a>
                          </div>
                          {m.name && (
                            <div className="text-xs text-muted-foreground mt-0.5">{m.name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={m.serviceType === "EASY" ? "secondary" : "outline"} className="text-xs">
                        {m.serviceType}
                      </Badge>
                      {!m.isActive && (
                        <Badge variant="destructive" className="text-xs ml-1">Inactive</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="flex items-center justify-center gap-1">
                        <Store className="w-3.5 h-3.5 text-muted-foreground" />
                        {m._count?.stores ?? 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">
                      {m._count?.orders ?? 0}
                    </td>
                    <td className="py-3 px-4">
                      {m.subscription ? (
                        <div>
                          <span className="capitalize font-medium">{m.subscription.plan}</span>
                          <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded border ${
                            m.subscription.status === "active"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}>
                            {m.subscription.status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">No plan</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <Link to={`/admin/merchants/${m.id}`}>
                        <Button variant="ghost" size="sm">
                          View <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
