"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface SearchValues {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

interface SearchContextValue {
  searchValues: SearchValues;
  setSearchValues: (values: SearchValues) => void;
}

const DEFAULT_SEARCH: SearchValues = { location: "", checkIn: "", checkOut: "", guests: 1 };

const SearchContext = createContext<SearchContextValue>({
  searchValues: DEFAULT_SEARCH,
  setSearchValues: () => {},
});

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchValues, setSearchValues] = useState<SearchValues>(DEFAULT_SEARCH);
  return (
    <SearchContext.Provider value={{ searchValues, setSearchValues }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}
