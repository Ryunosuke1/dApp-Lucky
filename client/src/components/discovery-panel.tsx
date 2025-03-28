import React, { useState } from "react";
import { RandomDAppCard } from "./random-dapp-card";
import { DeepResearchPanel } from "./deep-research-panel";
import { CommunityExperiences } from "./community-experiences";
import { useQuery } from "@tanstack/react-query";
import { DApp } from "@/types/dapp";
import { fetchRandomDApp } from "@/lib/dapp-service";

interface DiscoveryPanelProps {
  onShareExperience: () => void;
  onSetSelectedDApp: (dapp: DApp) => void;
}

export function DiscoveryPanel({ onShareExperience, onSetSelectedDApp }: DiscoveryPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDeepResearch, setShowDeepResearch] = useState(false);
  
  const { data: dapp, refetch, isLoading } = useQuery({
    queryKey: ['/api/dapps/random', selectedCategory],
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
    setShowDeepResearch(!showDeepResearch);
  };
  
  React.useEffect(() => {
    if (dapp) {
      onSetSelectedDApp(dapp);
    }
  }, [dapp, onSetSelectedDApp]);
  
  const categories = [
    { id: "defi", name: "DeFi" },
    { id: "nfts", name: "NFTs" },
    { id: "games", name: "Gaming" },
    { id: "social", name: "Social" },
    { id: "governance", name: "Governance" }
  ];

  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      {/* Discovery Header */}
      <div className="bg-primary-500 text-white p-6 flex flex-col">
        <h2 className="text-xl font-semibold heading">Discover dApps</h2>
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
        />
      )}
      
      {/* Community Experiences */}
      <CommunityExperiences 
        dappId={dapp?.id} 
        onShareExperience={onShareExperience} 
      />
    </div>
  );
}
