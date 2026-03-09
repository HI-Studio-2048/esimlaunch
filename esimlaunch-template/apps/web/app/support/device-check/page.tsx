'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Globe,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { safeFetch } from '@/lib/safe-fetch';
import { apiFetch } from '@/lib/apiClient';
import type { Location } from '@/lib/types';

interface DeviceCompatibility {
  model: string;
  brand: string;
  supported: boolean;
  notes: string[];
  regionalNotes: Record<string, string>;
}

export default function DeviceCheckPage() {
  const [deviceQuery, setDeviceQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeviceCompatibility | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const locations = await apiFetch<Location[]>('/esim/locations');
        const countryList = locations
          .filter((l) => l.type === 1)
          .map((l) => ({ code: l.code, name: l.name }));
        setCountries(countryList);
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (deviceQuery.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      try {
        const data = await safeFetch<{ models: string[] }>(
          `/device/models?q=${encodeURIComponent(deviceQuery)}`,
          { showToast: false }
        );
        setSuggestions(data.models || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
      }
    };
    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [deviceQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCheckCompatibility = async () => {
    if (!selectedDevice) {
      alert('Please select a device model');
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ model: selectedDevice });
      if (selectedCountry) params.append('country', selectedCountry);
      const data = await safeFetch<DeviceCompatibility>(
        `/device/check?${params.toString()}`,
        { errorMessage: 'Failed to check device compatibility. Please try again.' }
      );
      setResult(data);
      localStorage.setItem('deviceModel', selectedDevice);
    } catch (error) {
      console.error('Failed to check compatibility:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (model: string) => {
    setSelectedDevice(model);
    setDeviceQuery(model);
    setShowSuggestions(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-slate-600 transition-colors hover:text-violet-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-slate-900">
            Device Compatibility Checker
          </h1>
          <p className="text-slate-600">
            Check if your device supports eSIM before purchasing
          </p>
        </div>

        <Card className="mb-6 border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Search Your Device</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative" ref={suggestionsRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="e.g., iPhone 15, Samsung Galaxy S24..."
                  value={deviceQuery}
                  onChange={(e) => {
                    setDeviceQuery(e.target.value);
                    setSelectedDevice('');
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  className="border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400"
                />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
                  {suggestions.map((model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => handleSuggestionClick(model)}
                      className="w-full px-4 py-2 text-left text-slate-900 transition-colors hover:bg-slate-50"
                    >
                      {model}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <option value="">Select country (optional)</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleCheckCompatibility}
              disabled={!selectedDevice || loading}
              className="w-full bg-violet-600 text-white hover:bg-violet-700"
            >
              {loading ? 'Checking...' : 'Check Compatibility'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900">
                  Compatibility Result
                </CardTitle>
                <Badge
                  className={
                    result.supported
                      ? 'border-green-500/30 bg-green-500/20 text-green-700'
                      : 'border-red-500/30 bg-red-500/20 text-red-700'
                  }
                >
                  {result.supported ? (
                    <>
                      <CheckCircle2 className="mr-1 inline h-4 w-4" />
                      SUPPORTED
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1 inline h-4 w-4" />
                      NOT SUPPORTED
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Device</p>
                <p className="text-lg font-semibold text-slate-900">
                  {result.brand} {result.model}
                </p>
              </div>

              {result.notes && result.notes.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-slate-500">Important Notes</p>
                  <div className="space-y-2">
                    {result.notes.map((note, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3"
                      >
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <p className="text-sm text-slate-700">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCountry &&
                result.regionalNotes?.[selectedCountry.toUpperCase()] && (
                  <div>
                    <p className="mb-2 text-sm text-slate-500">
                      Country-Specific Information
                    </p>
                    <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
                      <p className="text-sm text-amber-800">
                        {result.regionalNotes[selectedCountry.toUpperCase()]}
                      </p>
                    </div>
                  </div>
                )}

              <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                {result.supported ? (
                  <>
                    <Link href="/">
                      <Button
                        variant="outline"
                        className="border-slate-200 text-slate-700 hover:bg-slate-50"
                      >
                        Browse Plans
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/support">
                      <Button
                        variant="secondary"
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                      >
                        View Installation Guide
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link href="/support">
                    <Button
                      variant="secondary"
                      className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      Contact Support
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
