import React, { useState, useEffect } from 'react';
import { DApp } from '@/types/dapp';
import { loadFavoritesFromMetaMask, saveFavoritesToMetaMask, removeFavorite } from '@/lib/metamask-service';
import { DndProvider, useDrag, useDrop, DragSourceMonitor, DropTargetMonitor } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DocumentDuplicateIcon, QrCodeIcon, ShareIcon } from '@heroicons/react/24/outline';
import TextListModal from './text-list-modal';
import QRCodeModal from './qr-code-modal';
import ShareExperienceModal from './share-experience-modal';
import { useToast } from '@/hooks/use-toast';

interface FavoritesPanelProps {
  currentDapp: DApp | null;
}

interface FavoriteItemProps {
  dapp: DApp;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  onRemove: (dapp: DApp) => void;
}

const ItemType = 'FAVORITE_DAPP';

const FavoriteItem: React.FC<FavoriteItemProps> = ({ dapp, index, moveItem, onRemove }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item: { index: number }, monitor: DropTargetMonitor) => {
      if (!ref.current) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      if (dragIndex === hoverIndex) {
        return;
      }
      
      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });
  
  drag(drop(ref));
  
  return (
    <div 
      ref={ref} 
      className={`nordic-card p-4 mb-2 flex items-center justify-between cursor-move backdrop-blur-sm transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100 hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-center">
        <div className="w-12 h-12 bg-gray-50/80 rounded-lg overflow-hidden flex-shrink-0 mr-4 border border-gray-100">
          {dapp.image ? (
            <img src={dapp.image} alt={dapp.name} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900">{dapp.name}</h3>
          {dapp.category && (
            <span className="text-xs text-gray-500">{dapp.category}</span>
          )}
        </div>
      </div>
      <button onClick={() => onRemove(dapp)} className="text-gray-400 hover:text-gray-500" title="Remove" aria-label={`Remove ${dapp.name} from favorites`}>
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

const FavoritesPanel: React.FC<FavoritesPanelProps> = ({ currentDapp }) => {
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<{ dapp: DApp, position: number }[]>([]);
  const [isTextListModalOpen, setIsTextListModalOpen] = useState(false);
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [isShareExperienceModalOpen, setIsShareExperienceModalOpen] = useState(false);
  
  // MetaMaskからお気に入りを読み込む
  const loadFavorites = async () => {
    try {
      const loadedFavorites = await loadFavoritesFromMetaMask();
      if (loadedFavorites) {
        setFavorites(loadedFavorites);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
      toast({
        title: "Error",
        description: "Failed to load favorites.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);
  
  const moveItem = async (dragIndex: number, hoverIndex: number) => {
    const newFavorites = [...favorites];
    const draggedItem = newFavorites[dragIndex];
    
    newFavorites.splice(dragIndex, 1);
    newFavorites.splice(hoverIndex, 0, draggedItem);
    
    try {
      const success = await saveFavoritesToMetaMask(newFavorites);
      if (success) {
        setFavorites(newFavorites);
      }
    } catch (error) {
      console.error('Failed to update favorites order:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites order.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFavorite = async (dapp: DApp) => {
    try {
      const success = await removeFavorite(dapp.id, favorites);
      if (success) {
        // 削除後のお気に入りを再読み込み
        await loadFavorites();
        toast({
          title: "Removed",
          description: `${dapp.name} has been removed from favorites.`,
        });
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      toast({
        title: "Error",
        description: "Failed to remove from favorites.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="nordic-card p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Favorites</h2>
        <span className="text-sm text-gray-500">{favorites.length} dApps</span>
      </div>
      
      {favorites.length === 0 ? (
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">
            Your favorites list is empty. Add dApps to your favorites to see them here.
          </p>
        </div>
      ) : (
        <DndProvider backend={HTML5Backend}>
          <div className="mb-4 max-h-[calc(100vh-24rem)] overflow-y-auto space-y-3 nordic-scrollbar pr-2">
            {favorites.map((favorite, index) => (
              <FavoriteItem
                key={favorite.dapp.id || index}
                dapp={favorite.dapp}
                index={index}
                moveItem={moveItem}
                onRemove={handleRemoveFavorite}
              />
            ))}
          </div>
        </DndProvider>
      )}
      
        <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Share Collection</h3>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => setIsTextListModalOpen(true)}
            className="nordic-button nordic-button-secondary flex items-center justify-center"
          >
            <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
            Export as Text
          </button>
          
          <button
            onClick={() => setIsQRCodeModalOpen(true)}
            className="nordic-button nordic-button-secondary flex items-center justify-center"
          >
            <QrCodeIcon className="h-5 w-5 mr-2" />
            Share via QR Code
          </button>
          
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my favorite dApps: ${favorites.map(f => f.dapp.name).join(', ')} #dAppExplorer #Web3`)}`, '_blank')}
              className="flex-1 nordic-button nordic-button-secondary flex items-center justify-center"
            >
              <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
              Twitter
            </button>
            
            <button
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(`Check out my favorite dApps: ${favorites.map(f => f.dapp.name).join(', ')}`)}`, '_blank')}
              className="flex-1 nordic-button nordic-button-secondary flex items-center justify-center"
            >
              <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
              Facebook
            </button>
            
            <button
              onClick={() => setIsShareExperienceModalOpen(true)}
              className="flex-1 nordic-button nordic-button-secondary flex items-center justify-center"
            >
              <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm3.61 6.34c1.07 0 1.93.86 1.93 1.93 0 1.07-.86 1.93-1.93 1.93-1.07 0-1.93-.86-1.93-1.93 0-1.07.86-1.93 1.93-1.93zm-6-1.58c1.3 0 2.36 1.06 2.36 2.36 0 1.3-1.06 2.36-2.36 2.36s-2.36-1.06-2.36-2.36c0-1.31 1.05-2.36 2.36-2.36zm0 9.13v3.75c-2.4-.75-4.3-2.6-5.14-4.96 1.05-1.12 3.67-1.69 5.14-1.69.53 0 1.2.08 1.9.22-1.64.87-1.9 2.02-1.9 2.68zM12 20c-.27 0-.53-.01-.79-.04v-4.07c0-1.42 2.94-2.13 4.4-2.13 1.07 0 2.92.39 3.84 1.15-1.17 2.97-4.06 5.09-7.45 5.09z" clipRule="evenodd" />
              </svg>
              Discord
            </button>
          </div>
        </div>
      </div>
      
      <TextListModal
        isOpen={isTextListModalOpen}
        onClose={() => setIsTextListModalOpen(false)}
        favorites={favorites.map(f => f.dapp)}
      />
      
      <QRCodeModal
        isOpen={isQRCodeModalOpen}
        onClose={() => setIsQRCodeModalOpen(false)}
        favorites={favorites.map(f => f.dapp)}
      />
      
      <ShareExperienceModal
        isOpen={isShareExperienceModalOpen}
        onClose={() => setIsShareExperienceModalOpen(false)}
        dapp={currentDapp}
      />
    </div>
  );
};

export default FavoritesPanel;
