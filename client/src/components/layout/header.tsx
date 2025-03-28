import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { metaMask } from "wagmi/connectors";
import { Wallet, ChevronDown, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ApiSettings, ApiSettingsModal } from "@/components/api-settings-modal";
import { useApiSettings } from "@/hooks/use-api-settings";

export function Header() {
  const { address, isConnected } = useAccount({
    onConnect: ({ address }) => {
      toast({
        title: "ウォレット接続完了",
        description: `MetaMaskウォレットが正常に接続されました！アドレス: ${address?.slice(0, 6)}...${address?.slice(-4)}`,
      });
    },
  });
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  
  // API設定のための状態
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const { settings, saveSettings } = useApiSettings();
  
  const handleWalletConnect = async () => {
    if (isConnected) return;
    
    setIsConnecting(true);
    
    try {
      // MetaMaskコネクターを使用して接続
      await connect({ connector: metaMask() });
      // 成功メッセージはonConnectイベントで表示されるので、ここでは表示しない
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        title: "接続失敗",
        description: "MetaMaskへの接続に失敗しました。MetaMask拡張機能がインストールされているか、接続を許可しているか確認してください。",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="flex items-center">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="ml-3 text-2xl font-bold text-gray-900 heading">dApp Lucky</h1>
          </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsApiSettingsOpen(true)}
              title="API設定"
              className="text-gray-500 hover:text-gray-700"
            >
              <Settings className="h-5 w-5" />
            </Button>
            
            {isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <Wallet className="mr-2 h-4 w-4" />
                    {shortenAddress(address)}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => disconnect()}>
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="outline" 
                onClick={handleWalletConnect}
                disabled={isConnecting}
                className="px-4 py-2 rounded-lg bg-primary-50 text-primary-600 font-medium hover:bg-primary-100 transition-colors"
              >
                {isConnecting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </>
                )}
              </Button>
            )}
            
            {/* API設定モーダル */}
            <ApiSettingsModal
              isOpen={isApiSettingsOpen}
              onClose={() => setIsApiSettingsOpen(false)}
              initialSettings={settings}
              onSave={(newSettings) => {
                saveSettings(newSettings);
                setIsApiSettingsOpen(false);
                toast({
                  title: "API設定を保存しました",
                  description: "新しいAPI設定が保存されました。",
                });
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function shortenAddress(address?: `0x${string}`): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
