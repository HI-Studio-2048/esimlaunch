import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Wifi, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCountryName } from "@/lib/countries";

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
  
  // Get full country name
  const countryName = getCountryName(pkg.locationCode);
  
  // Build package name with full country name
  // Replace country code in package name with full country name
  let displayName = pkg.name || '';
  if (pkg.name) {
    // Replace location code at the start with full country name
    const locationCodeRegex = new RegExp(`^${pkg.locationCode}\\s+`, 'i');
    displayName = pkg.name.replace(locationCodeRegex, `${countryName} `);
    
    // If no replacement happened, prepend country name
    if (displayName === pkg.name && !pkg.name.toLowerCase().includes(countryName.toLowerCase())) {
      displayName = `${countryName} ${pkg.name}`;
    }
  } else {
    // Fallback if no name
    displayName = `${countryName} ${dataGB}GB ${pkg.duration}${pkg.durationUnit}`;
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all relative overflow-hidden",
          isSelected 
            ? "border-4 border-primary bg-primary/10 shadow-md" 
            : "border-2 border-border hover:border-primary/50 hover:shadow-sm"
        )}
        onClick={() => onSelect(!isSelected)}
      >
        {isSelected && (
          <div className="absolute top-2 right-2 z-10">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                {displayName}
              </h3>
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-bold">${priceUSD}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1.5">
              <Wifi className="h-3.5 w-3.5" />
              <span className="font-medium">{dataGB}GB</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">
                {pkg.duration} {pkg.durationUnit}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}





