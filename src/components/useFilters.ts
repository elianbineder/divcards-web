"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { filtersFromQuery, filtersToQuery, type Filters } from "@/lib/filters";

/**
 * Index filters read from the URL. On the index they are rewritten in place (no history
 * entry, no server round trip); from any other page, setting them opens the index.
 */
export function useFilters(): [Filters, (next: Filters) => void] {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const filters = useMemo(() => filtersFromQuery(params), [params]);

  const setFilters = useCallback(
    (next: Filters) => {
      const query = filtersToQuery(next);
      const url = query ? `/?${query}` : "/";
      if (pathname === "/") window.history.replaceState(null, "", url);
      else router.push(url);
    },
    [pathname, router],
  );

  return [filters, setFilters];
}
