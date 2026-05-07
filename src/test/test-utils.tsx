import type { ReactElement, ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";

/**
 * Build a fresh QueryClient for each test so cache state never leaks between
 * tests. Retries are disabled so error-path tests don't pause for backoff.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: 0 },
      queries: { gcTime: 0, retry: false, staleTime: 0 },
    },
  });
}

interface ProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

export function TestProviders({ children, queryClient }: ProvidersProps) {
  const client = queryClient ?? createTestQueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  { queryClient, ...options }: RenderWithProvidersOptions = {},
) {
  const client = queryClient ?? createTestQueryClient();
  return {
    queryClient: client,
    ...render(ui, {
      wrapper: ({ children }) => (
        <TestProviders queryClient={client}>{children}</TestProviders>
      ),
      ...options,
    }),
  };
}
