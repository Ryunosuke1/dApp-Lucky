import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { DApp } from "@/types/dapp";

export function TrendingDApps() {
  const [trendingDapps, setTrendingDapps] = useState<TrendingDApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // In a real app, this would use React Query to fetch from an API
  useEffect(() => {
    // Simulating API call
    setTimeout(() => {
      setTrendingDapps([
        {
          id: "blur",
          name: "Blur",
          category: "NFT",
          subcategory: "Marketplace",
          change: 43,
          rank: 1
        },
        {
          id: "dydx",
          name: "dYdX",
          category: "DeFi",
          subcategory: "Derivatives",
          change: 27,
          rank: 2
        },
        {
          id: "lens",
          name: "Lens Protocol",
          category: "Social",
          subcategory: "Web3",
          change: -5,
          rank: 3
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  return (
    <Card className="mt-8 bg-white rounded-2xl shadow overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 heading">Trending Now</h2>
        <p className="mt-1 text-sm text-gray-500">Popular dApps this week</p>
        
        <div className="mt-4 space-y-3">
          {isLoading ? (
            <>
              <TrendingDAppSkeleton />
              <TrendingDAppSkeleton />
              <TrendingDAppSkeleton />
            </>
          ) : (
            trendingDapps.map((dapp) => (
              <div key={dapp.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50">
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-medium
                  ${dapp.rank === 1 ? 'bg-amber-500' : dapp.rank === 2 ? 'bg-amber-400' : 'bg-amber-300'} 
                  text-white
                `}>
                  {dapp.rank}
                </div>
                <div className="ml-3 flex-grow">
                  <h4 className="font-medium text-gray-900">{dapp.name}</h4>
                  <div className="text-xs text-gray-500">{dapp.category} • {dapp.subcategory}</div>
                </div>
                <div className="text-right">
                  <span className={`
                    inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                    ${dapp.change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                  `}>
                    {dapp.change >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {Math.abs(dapp.change)}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

function TrendingDAppSkeleton() {
  return (
    <div className="flex items-center p-3 rounded-lg">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="ml-3 flex-grow">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3 w-32 mt-1" />
      </div>
      <Skeleton className="h-5 w-12 rounded-md" />
    </div>
  );
}

interface TrendingDApp {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  change: number;
  rank: number;
}
