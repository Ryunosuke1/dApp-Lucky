import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DApp } from "@/types/dapp";
import { useToast } from "@/hooks/use-toast";
import { Share2, Heart, RefreshCw, Search, ExternalLink } from "lucide-react";
import { useAccount } from "wagmi";

interface RandomDAppCardProps {
  dapp: DApp | undefined;
  isLoading: boolean;
  onRefresh: () => void;
  onDeepResearch: () => void;
}

export function RandomDAppCard({
  dapp,
  isLoading,
  onRefresh,
  onDeepResearch,
}: RandomDAppCardProps) {
  const { toast } = useToast();
  const { isConnected, address } = useAccount();
  const [isFavorite, setIsFavorite] = useState(false);
  
  const addToFavoritesMutation = useMutation({
    mutationFn: async () => {
      if (!dapp) return;
      return apiRequest({
        method: "POST",
        url: "/api/favorites", 
        data: {
          walletAddress: address,
          dappId: dapp.id,
          dappData: dapp,
        }
      });
    },
    onSuccess: () => {
      setIsFavorite(true);
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: "Added to favorites",
        description: `${dapp?.name} has been added to your favorites.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add to favorites. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleAddToFavorites = () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to add to favorites.",
        variant: "destructive",
      });
      return;
    }
    
    addToFavoritesMutation.mutate();
  };
  
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 heading">Random dApp Spotlight</h3>
          <Button variant="ghost" size="sm" disabled>
            <RefreshCw className="h-5 w-5 mr-1" />
            New dApp
          </Button>
        </div>
        
        <Card className="bg-gray-50 p-4">
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-1/3 mb-4 sm:mb-0 sm:mr-4">
              <Skeleton className="h-40 w-full rounded-lg" />
              <div className="flex justify-between mt-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="sm:w-2/3">
              <div className="flex items-start justify-between">
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-16 w-full mt-3" />
              <div className="mt-4 flex space-x-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  if (!dapp) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 heading">Random dApp Spotlight</h3>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-5 w-5 mr-1" />
            New dApp
          </Button>
        </div>
        
        <Card className="bg-gray-50 p-4 py-12 text-center">
          <p className="text-gray-500">No dApp found. Please try refreshing.</p>
          <Button className="mt-4" onClick={onRefresh}>Refresh</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 heading">Random dApp Spotlight</h3>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-5 w-5 mr-1" />
          New dApp
        </Button>
      </div>
      
      <Card className="bg-gray-50 rounded-xl p-4 dapp-card">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-1/3 mb-4 sm:mb-0 sm:mr-4">
            <div className="bg-gray-200 rounded-lg overflow-hidden aspect-video">
              <img 
                src={dapp.image || "https://via.placeholder.com/400x225?text=No+Image"} 
                alt={`${dapp.name} screenshot`} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex justify-between mt-2">
              <div className="text-sm text-gray-500">
                {dapp.stats && (
                  <>
                    <span className="mr-2">
                      <i className="fas fa-signal"></i>
                      <span className="ml-1">{dapp.stats.activity || "Low"} Activity</span>
                    </span>
                    <span>
                      <i className="fas fa-user-friends"></i>
                      <span className="ml-1">{dapp.stats.users || "N/A"} users</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="sm:w-2/3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xl font-bold text-gray-900 heading">{dapp.name}</h4>
                <div className="flex items-center mt-1">
                  <Badge variant="secondary" className="bg-secondary-100 text-secondary-800">
                    {dapp.category || "Other"}
                  </Badge>
                  <span className="ml-2 text-sm text-gray-500">{dapp.website || "No website"}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={isFavorite ? "text-amber-500" : "text-gray-400 hover:text-amber-500"}
                onClick={handleAddToFavorites}
                disabled={addToFavoritesMutation.isPending || isFavorite}
              >
                <Heart className="h-6 w-6" fill={isFavorite ? "currentColor" : "none"} />
              </Button>
            </div>
            
            <p className="mt-3 text-gray-600">
              {dapp.description || "No description available."}
            </p>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                className="bg-primary-500 hover:bg-primary-600 text-white"
                size="sm"
                asChild
              >
                <a href={dapp.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit dApp
                </a>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onDeepResearch}
              >
                <Search className="h-4 w-4 mr-2" />
                Deep Research
              </Button>
              <Button 
                variant="outline" 
                size="sm"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
