import React, { useState } from "react";
import { RandomDAppCard } from "./random-dapp-card";
import { DeepResearchPanel } from "./deep-research-panel";
import { CommunityExperiences } from "./community-experiences";
import { useQuery } from "@tanstack/react-query";
import { DApp } from "@/types/dapp";
import { fetchRandomDApp, dappCategories } from "@/lib/dapp-service";
import { ApiSettingsModal } from "./api-settings-modal";
import { useApiSettings } from "@/hooks/use-api-settings";
import { Settings } from "lucide-react";
import { Button } from "./ui/button";

interface DiscoveryPanelProps {
  onShareExperience: () => void;
  onSetSelectedDApp: (dapp: DApp) => void;
}

export function DiscoveryPanel({ onShareExperience, onSetSelectedDApp }: DiscoveryPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>("All");
  const [showDeepResearch, setShowDeepResearch] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const { settings, saveSettings, isConfigured } = useApiSettings();
  
  const { data: dapp, refetch, isLoading } = useQuery({
    queryKey: ['dapp-random', selectedCategory],
    queryFn: () => fetchRandomDApp(selectedCategory),
  });
  
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    refetch();
  };
  
  const handleRefreshDApp = () => {
    refetch();
  };
  
  const handleDeepResearchToggle = () => {
    if (!isConfigured) {
      setShowApiSettings(true);
      return;
    }
    setShowDeepResearch(!showDeepResearch);
  };
  
  React.useEffect(() => {
    if (dapp) {
      onSetSelectedDApp(dapp);
    }
  }, [dapp, onSetSelectedDApp]);
  
  // Convert categories array to format needed for the UI
  const categories = dappCategories.map(category => ({
    id: category,
    name: category
  }));

  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      {/* Discovery Header */}
      <div className="bg-primary-500 text-white p-6 flex flex-col">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold heading">Discover dApps</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-primary-400 -mr-2"
            onClick={() => setShowApiSettings(true)}
            title="AI API Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        <p className="mt-1 text-primary-100">Find and explore new decentralized applications</p>
        
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map((category) => (
            <button 
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id 
                  ? "bg-white text-primary-600" 
                  : "bg-white/20 hover:bg-white/30 text-white"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Random DApp Card */}
      <RandomDAppCard 
        dapp={dapp}
        isLoading={isLoading}
        onRefresh={handleRefreshDApp}
        onDeepResearch={handleDeepResearchToggle}
      />
      
      {/* DeepResearch Panel */}
      {showDeepResearch && dapp && (
        <DeepResearchPanel 
          dapp={dapp} 
          onClose={() => setShowDeepResearch(false)} 
          apiSettings={settings}
        />
      )}
      
      {/* Community Experiences */}
      <CommunityExperiences 
        dappId={dapp?.id} 
        onShareExperience={onShareExperience} 
      />
      
      {/* API Settings Modal */}
      <ApiSettingsModal
        isOpen={showApiSettings}
        onClose={() => setShowApiSettings(false)}
        initialSettings={settings}
        onSave={saveSettings}
      />
    </div>
  );
}
