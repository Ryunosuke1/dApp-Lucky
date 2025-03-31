import { useState, useRef } from "react";
import { Button } from "@nordhealth/react";
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
import ApiSettingsModal from "@/components/api-settings-modal";
import { Header as NordHeader } from "@nordhealth/react";

export function Header() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  
  // API設定のための状態
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  
  const handleWalletConnect = async () => {
    if (isConnected) return;
    
    setIsConnecting(true);
    
    try {
      const connector = metaMask();
      await connect({ connector });
      
      // 接続成功後、addressが更新されるのを待つ
      if (address) {
        toast({
          title: "ウォレット接続完了",
          description: `MetaMaskウォレットが正常に接続されました！アドレス: ${shortenAddress(address)}`,
        });
      }
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
    <NordHeader className="bg-white shadow-sm nordic-pattern">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
        <div className="flex items-center space-x-4">
          <a href="/" className="text-xl font-semibold text-gray-900">dApp Explorer</a>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="primary"
            onClick={handleWalletConnect}
            disabled={isConnecting || isConnected}
          >
            {isConnecting ? "Connecting..." : isConnected ? "Connected" : "Connect Wallet"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button ref={settingsBtnRef} variant="secondary">
                <Settings className="mr-2 h-5 w-5" />
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setIsApiSettingsOpen(true)}>
                API Settings
              </DropdownMenuItem>
              {isConnected && (
                <DropdownMenuItem onSelect={() => disconnect()}>
                  Disconnect
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ApiSettingsModal
        isOpen={isApiSettingsOpen}
        onClose={() => setIsApiSettingsOpen(false)}
        triggerRef={settingsBtnRef}
      />
    </NordHeader>
  )
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
