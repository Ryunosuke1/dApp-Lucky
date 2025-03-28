import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import { MainLayout } from "@/components/layout/main-layout";
import { WagmiConfig } from "wagmi";
import { wagmiConfig } from "./lib/web3-service";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <MainLayout>
          <Router />
        </MainLayout>
        <Toaster />
      </WagmiConfig>
    </QueryClientProvider>
  );
}

export default App;
