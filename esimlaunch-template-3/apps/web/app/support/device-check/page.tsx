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
    <div className="min-h-screen" style={{ background: 'var(--night)' }}>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--electric)'}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold" style={{ color: 'var(--text)' }}>
            Device Compatibility Checker
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Check if your device supports eSIM before purchasing
          </p>
        </div>

        <div
          className="mb-6 rounded-card"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--night-50)',
          }}
        >
          <div className="p-6 pb-2">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Search Your Device</h3>
          </div>
          <div className="space-y-4 p-6 pt-2">
            <div className="relative" ref={suggestionsRef}>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
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
                  className="input w-full pl-10"
                  style={{ color: 'var(--text)' }}
                />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div
                  className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-card"
                  style={{
                    border: '1px solid var(--border)',
                    background: 'var(--night-100)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}
                >
                  {suggestions.map((model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => handleSuggestionClick(model)}
                      className="w-full px-4 py-2 text-left transition-colors"
                      style={{ color: 'var(--text)' }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--night-50)'}
                      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <Globe
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="h-10 w-full rounded-card pl-10 pr-3 focus-visible:outline-none focus-visible:ring-2 transition-all"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--night-100)',
                  color: 'var(--text)',
                  outline: 'none',
                }}
              >
                <option value="">Select country (optional)</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCheckCompatibility}
              disabled={!selectedDevice || loading}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Compatibility'}
            </button>
          </div>
        </div>

        {result && (
          <div
            className="rounded-card"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--night-50)',
            }}
          >
            <div className="p-6 pb-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                  Compatibility Result
                </h3>
                <span
                  className="inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold"
                  style={
                    result.supported
                      ? {
                          border: '1px solid rgba(0,229,192,0.3)',
                          background: 'rgba(0,229,192,0.12)',
                          color: 'var(--glow)',
                        }
                      : {
                          border: '1px solid rgba(239,68,68,0.3)',
                          background: 'rgba(239,68,68,0.12)',
                          color: '#f87171',
                        }
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
                </span>
              </div>
            </div>
            <div className="space-y-4 p-6 pt-2">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Device</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                  {result.brand} {result.model}
                </p>
              </div>

              {result.notes && result.notes.length > 0 && (
                <div>
                  <p className="mb-2 text-sm" style={{ color: 'var(--text-muted)' }}>Important Notes</p>
                  <div className="space-y-2">
                    {result.notes.map((note, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 rounded-card p-3"
                        style={{
                          border: '1px solid rgba(245,158,11,0.3)',
                          background: 'rgba(245,158,11,0.08)',
                        }}
                      >
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: '#f59e0b' }} />
                        <p className="text-sm" style={{ color: 'var(--text)' }}>{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCountry &&
                result.regionalNotes?.[selectedCountry.toUpperCase()] && (
                  <div>
                    <p className="mb-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                      Country-Specific Information
                    </p>
                    <div
                      className="rounded-card p-3"
                      style={{
                        border: '1px solid rgba(245,158,11,0.3)',
                        background: 'rgba(245,158,11,0.08)',
                      }}
                    >
                      <p className="text-sm" style={{ color: '#fbbf24' }}>
                        {result.regionalNotes[selectedCountry.toUpperCase()]}
                      </p>
                    </div>
                  </div>
                )}

              <div
                className="flex flex-wrap gap-3 pt-4"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                {result.supported ? (
                  <>
                    <Link href="/">
                      <button className="btn-secondary inline-flex items-center gap-2">
                        Browse Plans
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </Link>
                    <Link href="/support">
                      <button className="btn-ghost inline-flex items-center gap-2">
                        View Installation Guide
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </Link>
                  </>
                ) : (
                  <Link href="/support">
                    <button className="btn-ghost inline-flex items-center gap-2">
                      Contact Support
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
