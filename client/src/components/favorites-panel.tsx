import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Favorite } from "@shared/schema";
import { DApp } from "@/types/dapp";
import { useToast } from "@/hooks/use-toast";
import { List, QrCode, GripVertical, X, Twitter, Facebook } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { TrendingDApps } from "./trending-dapps";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FavoritesPanelProps {
  onGenerateTextList: () => void;
  onGenerateQRCode: () => void;
}

export function FavoritesPanel({ onGenerateTextList, onGenerateQRCode }: FavoritesPanelProps) {
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  
  const { data, isLoading } = useQuery({
    queryKey: ['/api/favorites'],
  });
  
  useEffect(() => {
    if (data) {
      setFavorites(data as Favorite[]);
    }
  }, [data]);
  
  const removeFavoriteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/favorites/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: "Removed from favorites",
        description: "The dApp has been removed from your favorites.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from favorites. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const reorderFavoritesMutation = useMutation({
    mutationFn: async (favorites: { id: number; position: number }[]) => {
      return apiRequest("PUT", "/api/favorites/reorder", { favorites });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder favorites. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleRemoveFavorite = (id: number) => {
    removeFavoriteMutation.mutate(id);
  };
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = favorites.findIndex(f => f.id === active.id);
      const newIndex = favorites.findIndex(f => f.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newFavorites = arrayMove(favorites, oldIndex, newIndex);
        setFavorites(newFavorites);
        
        // Update positions
        const updatedPositions = newFavorites.map((favorite, index) => ({
          id: favorite.id,
          position: index + 1
        }));
        
        reorderFavoritesMutation.mutate(updatedPositions);
      }
    }
  };
  
  return (
    <>
      <Card className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="bg-secondary-500 text-white p-6">
          <h2 className="text-xl font-semibold heading">Your Favorites</h2>
          <p className="mt-1 text-secondary-100">Drag and drop to reorder</p>
        </div>
        
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-2">
              <FavoriteSkeleton />
              <FavoriteSkeleton />
              <FavoriteSkeleton />
            </div>
          ) : favorites.length === 0 ? (
            <div id="emptyFavorites" className="py-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className="mt-2 text-gray-500">No favorites yet</p>
              <p className="text-sm text-gray-400">Discover dApps and add them to your favorites</p>
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={favorites.map(f => f.id)} 
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 min-h-[200px]">
                  {favorites.map(favorite => (
                    <SortableFavoriteItem 
                      key={favorite.id} 
                      favorite={favorite} 
                      onRemove={handleRemoveFavorite} 
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
        
        {/* Share Favorites */}
        <div className="p-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Share Your Collection</h3>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={onGenerateTextList}
              disabled={favorites.length === 0}
            >
              <List className="mr-2 h-4 w-4" />
              Generate Text List
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={onGenerateQRCode}
              disabled={favorites.length === 0}
            >
              <QrCode className="mr-2 h-4 w-4" />
              Generate QR Code
            </Button>
            
            <div className="flex space-x-2">
              <Button
                className="flex-1 bg-[#1DA1F2] hover:bg-[#1a94e0]"
                disabled={favorites.length === 0}
              >
                <Twitter className="mr-2 h-4 w-4" />
                Twitter
              </Button>
              <Button
                className="flex-1 bg-[#4267B2] hover:bg-[#3b5998]"
                disabled={favorites.length === 0}
              >
                <Facebook className="mr-2 h-4 w-4" />
                Facebook
              </Button>
              <Button
                className="flex-1 bg-[#5865F2] hover:bg-[#4a56cf]"
                disabled={favorites.length === 0}
              >
                <FaDiscord className="mr-2 h-4 w-4" />
                Discord
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      <TrendingDApps />
    </>
  );
}

interface SortableFavoriteItemProps {
  favorite: Favorite;
  onRemove: (id: number) => void;
}

function SortableFavoriteItem({ favorite, onRemove }: SortableFavoriteItemProps) {
  const dapp = favorite.dappData as unknown as DApp;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: favorite.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="favorite-item bg-gray-50 rounded-lg p-3 flex items-center justify-between cursor-move"
      {...attributes}
    >
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
          <img 
            src={dapp.image || "https://via.placeholder.com/40?text=dApp"} 
            className="h-full w-full object-cover" 
            alt={dapp.name} 
          />
        </div>
        <div className="ml-3">
          <h4 className="font-medium text-gray-900">{dapp.name}</h4>
          <div className="text-xs text-gray-500">
            {dapp.category || "Other"} • {dapp.subcategory || "App"}
          </div>
        </div>
      </div>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-gray-600 p-1 h-auto"
          onClick={() => onRemove(favorite.id)}
        >
          <X className="h-5 w-5" />
        </Button>
        <div
          className="ml-1 text-gray-400 p-1 cursor-grab"
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function FavoriteSkeleton() {
  return (
    <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="ml-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-20 mt-1" />
        </div>
      </div>
      <div className="flex items-center">
        <Skeleton className="h-5 w-5 rounded-md" />
        <Skeleton className="h-5 w-5 ml-1 rounded-md" />
      </div>
    </div>
  );
}
