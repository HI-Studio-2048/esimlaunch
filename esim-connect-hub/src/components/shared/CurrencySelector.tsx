import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currencyService } from "@/lib/api";

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

interface CurrencySelectorProps {
  value?: string;
  onChange?: (currency: string) => void;
  storeId?: string;
  className?: string;
}

export function CurrencySelector({ value, onChange, storeId, className }: CurrencySelectorProps) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState(value || 'USD');
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>([]);

  useEffect(() => {
    loadCurrencies();
    if (storeId) {
      loadStoreCurrencySettings();
    }
  }, [storeId]);

  const loadCurrencies = async () => {
    try {
      const result = await currencyService.getAvailableCurrencies();
      setCurrencies(result);
    } catch (error) {
      console.error('Failed to load currencies:', error);
      // Fallback to common currencies
      setCurrencies([
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound' },
      ]);
    }
  };

  const loadStoreCurrencySettings = async () => {
    if (!storeId) return;
    try {
      const settings = await currencyService.getStoreCurrency(storeId);
      setSupportedCurrencies(settings.supported || ['USD']);
      if (!selectedCurrency || !settings.supported.includes(selectedCurrency)) {
        setSelectedCurrency(settings.default);
        onChange?.(settings.default);
      }
    } catch (error) {
      console.error('Failed to load store currency settings:', error);
    }
  };

  const handleChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    onChange?.(newCurrency);
    // Store in localStorage for persistence
    localStorage.setItem('preferred_currency', newCurrency);
  };

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('preferred_currency');
    if (saved && (!storeId || supportedCurrencies.includes(saved))) {
      setSelectedCurrency(saved);
      onChange?.(saved);
    }
  }, [supportedCurrencies]);

  // Filter currencies based on store support
  const availableCurrencies = storeId && supportedCurrencies.length > 0
    ? currencies.filter(c => supportedCurrencies.includes(c.code))
    : currencies;

  return (
    <Select value={selectedCurrency} onValueChange={handleChange}>
      <SelectTrigger className={className}>
        <SelectValue>
          {currencies.find(c => c.code === selectedCurrency)?.symbol || '$'} {selectedCurrency}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableCurrencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {currency.symbol} {currency.code} - {currency.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}










