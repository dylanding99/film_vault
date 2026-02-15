'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { searchCities, type CitySuggestion, type Location } from '@/lib/geocoding';
import { Loader2 } from 'lucide-react';

interface LocationSearchInputProps {
  value?: string;
  lat?: number;
  lon?: number;
  city?: string;
  country?: string;
  onSelect: (location: Location) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function LocationSearchInput({
  value,
  lat,
  lon,
  city,
  country,
  onSelect,
  placeholder = '搜索城市...',
  disabled = false,
}: LocationSearchInputProps) {
  // Debug: log when component receives props
  useEffect(() => {
    console.log('[LocationSearchInput] Props received:', { value, lat, lon, city, country });
  }, [value, lat, lon, city, country]);

  // Debug: log when location changes
  useEffect(() => {
    console.log('[LocationSearchInput] Location state:', { value, lat, lon, city, country });
  }, [lat, lon, city, country]);

  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Display current location text
  const displayValue = query || city && country ? `${city}, ${country}` : value || '';

  // Search for cities (debounced)
  const searchCitiesDebounced = useCallback((searchQuery: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchCities(searchQuery);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '搜索失败';
        setError(errorMessage);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    searchCitiesDebounced(newQuery);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: CitySuggestion) => {
    const location: Location = {
      lat: suggestion.lat,
      lon: suggestion.lon,
      city: suggestion.city,
      country: suggestion.country,
      displayName: suggestion.displayName,
    };

    setQuery(suggestion.displayName);
    setShowSuggestions(false);
    setSuggestions([]);
    onSelect(location);
  };

  // Handle input focus
  const handleFocus = () => {
    if (query && query.trim().length >= 2) {
      searchCitiesDebounced(query);
    }
  };

  // Clear location
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    onSelect({
      lat: undefined,
      lon: undefined,
      city: '',
      country: '',
      displayName: '',
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {isLoading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {(displayValue || query) && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="px-2 py-1 text-sm text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            清除
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-input rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-accent focus:bg-accent focus:outline-none text-sm"
            >
              <div className="font-medium">{suggestion.city}</div>
              <div className="text-xs text-muted-foreground">{suggestion.country}</div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && !isLoading && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-input rounded-md shadow-lg px-3 py-2 text-sm text-muted-foreground"
        >
          未找到匹配的城市
        </div>
      )}
    </div>
  );
}
