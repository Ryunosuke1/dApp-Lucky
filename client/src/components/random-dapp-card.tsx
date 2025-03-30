import { useState, useEffect, useCallback, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Heart, RefreshCw, ExternalLink, Search } from "lucide-react";
import { DApp } from "@/types/dapp";
import { InvalidateQueryFilters, useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { addFavorite, loadFavoritesFromMetaMask } from "@/lib/metamask-service";
import { fetchRandomDApp } from "@/lib/dapp-service";

// 統計情報表示用のメモ化コンポーネント
const DAppStats = memo(({ stats }: { stats: DApp['stats'] }) => {
  if (!stats) return null;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gray-50/80 p-4 rounded-lg backdrop-blur-sm">
        <div className="text-sm text-gray-600">Users</div>
        <div className="font-semibold text-lg">{stats.users}</div>
      </div>
      <div className="bg-gray-50/80 p-4 rounded-lg backdrop-blur-sm">
        <div className="text-sm text-gray-600">Activity</div>
        <div className="font-semibold text-lg">{stats.activity}</div>
      </div>
      <div className="bg-gray-50/80 p-4 rounded-lg backdrop-blur-sm">
        <div className="text-sm text-gray-600">Volume</div>
        <div className="font-semibold text-lg">{stats.volume}</div>
      </div>
      <div className="bg-gray-50/80 p-4 rounded-lg backdrop-blur-sm">
        <div className="text-sm text-gray-600">Balance</div>
        <div className="font-semibold text-lg">{stats.balance}</div>
      </div>
    </div>
  );
});

DAppStats.displayName = 'DAppStats';

// 対応チェーン表示用のメモ化コンポーネント
const DAppChains = memo(({ chains }: { chains: string[] }) => {
  if (!chains?.length) return null;
  
  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">Supported Chains</div>
      <div className="flex flex-wrap gap-2">
        {chains.map((chain, index) => (
          <Badge 
            key={index} 
            variant="secondary" 
            className="bg-gray-50/80 text-gray-700 backdrop-blur-sm px-3 py-1"
          >
            {chain}
          </Badge>
        ))}
      </div>
    </div>
  );
});

DAppChains.displayName = 'DAppChains';

// タグ表示用のメモ化コンポーネント
const DAppTags = memo(({ tags }: { tags: string[] }) => {
  if (!tags?.length) return null;
  
  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">Tags</div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Badge 
            key={index} 
            variant="outline" 
            className="text-sm px-3 py-1 bg-white/50 backdrop-blur-sm"
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
});

DAppTags.displayName = 'DAppTags';

export function RandomDappCard() {
  const { toast } = useToast();
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);

  // React QueryでdAppのフェッチを管理
  const { data: dapp, isLoading, refetch } = useQuery({
    queryKey: ['randomDapp'],
    queryFn: () => fetchRandomDApp(),
    staleTime: 5 * 60 * 1000, // 5分間はキャッシュを使用
  });

  // React QueryでFavoritesの管理
  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: loadFavoritesFromMetaMask,
    staleTime: Infinity, // お気に入りは手動で更新するまでキャッシュを使用
  });

  // お気に入り状態の計算をメモ化
  const isFavorite = useCallback(() => {
    if (!dapp || !favorites?.length) return false;
    return favorites.some(fav => fav.dapp.id === dapp.id);
  }, [dapp, favorites]);

  // お気に入り追加のミューテーション
  const addFavoriteMutation = useMutation<unknown, Error, DApp>({
    mutationFn: (dapp) => {
      return apiRequest({
        method: "POST",
        url: "/api/favorites",
        data: { dapp }
      });
    },
    onSuccess: () => {
      const query: InvalidateQueryFilters = {
        queryKey: ['favorites']
      };
      queryClient.invalidateQueries(query);
    },
    onError: () => {
      toast({
      title: "Error",
      description: "Failed to add to favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  // お気に入りに追加する関数
  const handleAddToFavorites = async () => {
    if (!dapp || isFavorite() || isAddingFavorite) return;
    
    setIsAddingFavorite(true);
    
    try {
      const currentFavorites = favorites || [];
      await addFavoriteMutation.mutateAsync(dapp);
        
      const success = await addFavorite(dapp, currentFavorites);
      if (success) {
        const newPosition = currentFavorites.length > 0 
          ? Math.max(...currentFavorites.map(fav => fav.position)) + 1 
          : 1;
        
        const updatedFavorites = [...currentFavorites, { dapp, position: newPosition }];
        queryClient.setQueryData(['favorites'], updatedFavorites);
        
        toast({
        title: "Added to Favorites",
        description: `${dapp.name} has been added to your favorites.`,
        });
      } else {
        throw new Error("Failed to add to favorites");
      }
    } catch (error) {
      console.error("Error adding to favorites:", error);
      toast({
        title: "Error",
        description: "Failed to add to favorites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingFavorite(false);
    }
  };

  if (isLoading || !dapp) {
    return (
      <Card className="nordic-card">
        <CardContent className="nordic-card-content">
          <div className="animate-pulse space-y-6">
            <div className="flex justify-between">
              <div className="space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-16 w-16 rounded-lg" />
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="nordic-card">
      <CardContent className="nordic-card-content">
        <div className="flex justify-between items-start space-x-6 mb-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900">{dapp.name}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary-50 text-primary-700 border-primary-200 px-3 py-1">
                {dapp.category}
              </Badge>
              {dapp.subcategory && (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 px-3 py-1">
                  {dapp.subcategory}
                </Badge>
              )}
            </div>
          </div>
          <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
            {dapp.image ? (
              <img 
                src={dapp.image} 
                alt={`${dapp.name} logo`} 
                className="h-full w-full object-contain"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/64?text=dApp";
                }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        <p className="text-gray-600 mb-6 text-lg leading-relaxed">{dapp.description}</p>
        
        <div className="space-y-6">
          <DAppStats stats={dapp.stats} />
          <DAppChains chains={dapp.chains || []} />
          <DAppTags tags={dapp.tags || []} />
        </div>
        
        <div className="flex flex-wrap gap-3 mt-8">
          <Button
            variant="default"
            className="flex-1 h-11 text-base"
            onClick={handleAddToFavorites}
            disabled={isFavorite() || isAddingFavorite}
          >
            {isAddingFavorite ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : isFavorite() ? (
              <>
                <Heart className="mr-2 h-5 w-5 fill-current" />
                Added to Favorites
              </>
            ) : (
              <>
                <Heart className="mr-2 h-5 w-5" />
                Add to Favorites
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="flex-1 h-11 text-base"
            onClick={() => {
              console.log("DeepResearch clicked");
            }}
          >
            <Search className="mr-2 h-5 w-5" />
            DeepResearch
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11"
            onClick={() => refetch()}
            title="Show another dApp"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
          
          {dapp.website && (
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11"
              onClick={() => window.open(dapp.website, '_blank')}
              title="Visit Website"
            >
              <ExternalLink className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
