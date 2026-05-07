import { StrictMode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";

import App from "./app/App";
import { ErrorBoundary } from "./components/error-boundary";
import { AuthProvider } from "./features/auth";
import { queryClient } from "./services/queryClient";
import "./styles/index.css";

async function enableMocking() {
  const shouldEnableMockApi = import.meta.env.DEV
    ? import.meta.env.VITE_ENABLE_MOCK_API !== "false"
    : import.meta.env.VITE_ENABLE_MOCK_API === "true";

  if (!shouldEnableMockApi) {
    return;
  }

  const { worker } = await import("./mocks/browser");
  await worker.start({
    onUnhandledRequest: "bypass",
  });
}

void enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </AuthProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
});
