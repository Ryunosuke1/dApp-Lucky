import { useState, useRef } from "react";
import { DApp } from "@/types/dapp";
import { MainLayout } from "@/components/layout/main-layout";
import { useToast } from "@/hooks/use-toast";
import ApiSettingsModal from "@/components/api-settings-modal";
import TrendingDapps from "@/components/trending-dapps";
import FavoritesPanel from "@/components/favorites-panel";
import DiscoveryPanel from "@/components/discovery-panel";
import { RandomDappCard } from "@/components/random-dapp-card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Home() {
  const [currentDapp, setCurrentDapp] = useState<DApp | null>(null);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const apiSettingsBtnRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();

  const handleSelectTrendingDapp = (dapp: DApp) => {
    setCurrentDapp(dapp);
    toast({
      title: "dApp Selected",
      description: `${dapp.name} has been selected.`,
    });
  };

  return (
    <MainLayout>
      <main className="flex-1 min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* メインコンテンツエリア */}
            <div className="lg:col-span-8 space-y-6">
              {/* ランダムdAppカード */}
              <section className="rounded-lg overflow-hidden">
                <RandomDappCard />
              </section>

              {/* ディスカバリーパネル */}
              <section className="rounded-lg overflow-hidden">
                <DiscoveryPanel 
                  dapp={currentDapp || undefined}
                  onDeepResearch={() => {
                    console.log("DeepResearch clicked");
                  }}
                  onLoadRandomDapp={() => {
                    setCurrentDapp(null);
                  }}
                />
              </section>
            </div>

            {/* サイドバーエリア */}
            <div className="lg:col-span-4 space-y-6">
              <ScrollArea className="h-[calc(100vh-6rem)]">
                <div className="space-y-6 pr-4">
                  {/* お気に入りパネル */}
                  <section className="rounded-lg overflow-hidden backdrop-blur-sm bg-white/80">
                    <FavoritesPanel currentDapp={currentDapp} />
                  </section>

                  {/* トレンドdApps */}
                  <section className="rounded-lg overflow-hidden backdrop-blur-sm bg-white/80">
                    <TrendingDapps onSelectDapp={handleSelectTrendingDapp} />
                  </section>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </main>

      <ApiSettingsModal
        isOpen={isApiSettingsOpen}
        onClose={() => setIsApiSettingsOpen(false)}
        triggerRef={apiSettingsBtnRef}
      />
    </MainLayout>
  );
}
