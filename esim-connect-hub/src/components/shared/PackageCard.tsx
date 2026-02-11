import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, Clock, Globe, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PackageCardProps {
  package: {
    packageCode: string;
    slug: string;
    name: string;
    price: number;
    currencyCode: string;
    volume: number;
    duration: number;
    durationUnit: string;
    location: string;
    locationCode: string;
    description?: string;
  };
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  showCheckbox?: boolean;
}

export function PackageCard({ 
  package: pkg, 
  isSelected, 
  onSelect,
  showCheckbox = true 
}: PackageCardProps) {
  // Convert bytes to GB
  const dataGB = (pkg.volume / (1024 * 1024 * 1024)).toFixed(1);
  
  // Format price (price is in smallest unit, so divide by 10000 for USD)
  const priceUSD = (pkg.price / 10000).toFixed(2);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={() => onSelect(!isSelected)}
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            {showCheckbox && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
                onClick={(e) => e.stopPropagation()}
                className="mt-1"
              />
            )}
            
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{pkg.name || pkg.location}</h3>
                  {pkg.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {pkg.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">${priceUSD}</div>
                  <div className="text-xs text-muted-foreground">{pkg.currencyCode}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-medium">{dataGB} GB</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Validity:</span>
                  <span className="font-medium">
                    {pkg.duration} {pkg.durationUnit}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{pkg.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {pkg.locationCode}
                  </Badge>
                </div>
              </div>

              {pkg.slug && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground font-mono">
                    Slug: {pkg.slug}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}


