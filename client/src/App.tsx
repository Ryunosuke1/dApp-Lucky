import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import { MainLayout } from "@/components/layout/main-layout";
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { WagmiConfig } from "wagmi";
import { wagmiConfig, SUPPORTED_CHAINS, initializeMetaMaskSDK } from "./lib/web3-service";
import { useEffect, useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isSdkInitialized, setIsSdkInitialized] = useState(false);

  // Initialize MetaMask SDK when the app loads
  useEffect(() => {
    const initSDK = async () => {
      try {
        // Initialize the MetaMask SDK
        const provider = initializeMetaMaskSDK();
        
        if (provider) {
          console.log('MetaMask SDK initialized successfully');
          setIsSdkInitialized(true);
        } else {
          console.warn('MetaMask SDK initialization returned no provider');
        }
      } catch (error) {
        console.error('Failed to initialize MetaMask SDK:', error);
      }
    };

    initSDK();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: '#3B82F6', // Blue color matching our Nordic theme
            borderRadius: 'medium',
          })}
        >
          <MainLayout>
            <Router />
          </MainLayout>
          <Toaster />
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}

export default App;
