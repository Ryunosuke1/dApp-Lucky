import React, { useState, useMemo, useCallback } from 'react';
import { DApp } from '@/types/dapp';
import { addFavorite, loadFavoritesFromMetaMask } from '@/lib/metamask-service';
import { ArrowPathIcon, PlusIcon, MagnifyingGlassIcon, ArrowTopRightOnSquareIcon, ShareIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import QRCodeModal from './qr-code-modal';
import TextListModal from './text-list-modal';
import ShareExperienceModal from './share-experience-modal';
import { useToast } from '@/hooks/use-toast';

interface ShareOption {
  name: string;
  url?: string;
  action?: () => Promise<void>;
}

interface DiscoveryPanelProps {
  dapp?: DApp;
  onDeepResearch: () => void;
  onLoadRandomDapp: () => void;
}

const DiscoveryPanel: React.FC<DiscoveryPanelProps> = ({ dapp, onDeepResearch, onLoadRandomDapp }) => {
  if (!dapp) {
    return null;
  }

  const { toast } = useToast();
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [isTextListModalOpen, setIsTextListModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareOptions, setShareOptions] = useState<ShareOption[]>([]);
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);

  const handleAddToFavorites = useCallback(async () => {
    if (isAddingFavorite) return;

    try {
      setIsAddingFavorite(true);
      const favorites = await loadFavoritesFromMetaMask() || [];
      const success = await addFavorite(dapp, favorites);
      
      if (success) {
        toast({
          title: "お気に入りに追加しました",
          description: `${dapp.name}をお気に入りに追加しました。`,
        });
      }
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      toast({
        title: "エラー",
        description: "お気に入りの追加に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsAddingFavorite(false);
    }
  }, [dapp, isAddingFavorite, toast]);

  const handleShare = useCallback(async () => {
    try {
      const shareData = {
        title: dapp.name,
        text: `${dapp.name} - ${dapp.description} #dAppExplorer #Web3 ${dapp.category ? '#' + dapp.category : ''}`,
        url: dapp.website,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        const shareUrl = encodeURIComponent(dapp.website || window.location.href);
        const shareText = encodeURIComponent(shareData.text);
        
        const options = [
          {
            name: 'Twitter',
            url: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
          },
          {
            name: 'Facebook',
            url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`,
          },
          {
            name: 'Discord',
            action: async () => {
              await navigator.clipboard.writeText(`${shareData.text}\n${dapp.website}`);
              toast({
                title: "コピーしました",
                description: "Discordに貼り付けできます",
              });
            }
          }
        ];

        setShareOptions(options);
        setIsShareModalOpen(true);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "エラー",
        description: "共有に失敗しました",
        variant: "destructive",
      });
    }
  }, [dapp, toast]);

  const handleShareOptionSelect = useCallback(async (option: ShareOption) => {
    try {
      if (option.action) {
        await option.action();
      } else if (option.url) {
        window.open(option.url, '_blank');
      }
    } catch (error) {
      console.error('Error executing share option:', error);
      toast({
        title: "エラー",
        description: "共有に失敗しました",
        variant: "destructive",
      });
    }
  }, []);

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'defi', name: 'DeFi' },
    { id: 'nft', name: 'NFT' },
    { id: 'gamefi', name: 'GameFi' },
    { id: 'metaverse', name: 'Metaverse' },
    { id: 'infrastructure', name: 'Infrastructure' },
    { id: 'social', name: 'Social' },
  ];

  const memoizedDappImage = useMemo(() => (
    dapp?.image ? (
      <img
        src={dapp.image}
        alt={`${dapp.name} logo`}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    ) : (
      <div className="text-gray-400 text-center p-4">
        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p>No image available</p>
      </div>
    )
  ), [dapp?.image, dapp?.name]);

  const memoizedChains = useMemo(() => (
    dapp?.chains && dapp.chains.length > 0 && (
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-1">Supported Chains</h3>
        <div className="flex flex-wrap gap-1">
          {dapp?.chains?.map((chain) => (
            <span
              key={chain}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
            >
              {chain}
            </span>
          ))}
        </div>
      </div>
    )
  ), [dapp?.chains]);

  const memoizedStats = useMemo(() => (
    dapp?.stats && (
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {dapp?.stats?.users && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Users</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {typeof dapp.stats.users === 'number'
                ? new Intl.NumberFormat().format(dapp.stats.users)
                : dapp.stats.users}
            </p>
          </div>
        )}
        
        {dapp?.stats?.activity && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Activity</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900">{dapp.stats.activity}</p>
          </div>
        )}
        
        {dapp?.stats?.volume && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Volume</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900">{dapp.stats.volume}</p>
          </div>
        )}
        
        {dapp?.stats?.tvl && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">TVL</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900">{dapp.stats.tvl}</p>
          </div>
        )}
      </div>
    )
  ), [dapp?.stats]);

  return (
    <div className="nordic-card p-6 animate-fadeIn">
      <div className="flex justify-end mb-4">
        <div className="flex space-x-2">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`nordic-button ${
                category.id === (dapp?.category?.toLowerCase() || 'all')
                  ? 'nordic-button-primary'
                  : 'nordic-button-secondary'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 mb-4 md:mb-0 md:mr-6">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            {memoizedDappImage}
          </div>
        </div>

        <div className="md:w-2/3">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{dapp?.name}</h2>
          
          {dapp?.category && (
            <div className="mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {dapp.category}
              </span>
              {dapp?.subcategory && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {dapp.subcategory}
                </span>
              )}
            </div>
          )}

          <p className="text-gray-600 mb-4">{dapp?.description}</p>

          {memoizedChains}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleAddToFavorites}
              className="nordic-button nordic-button-primary flex items-center"
              disabled={isAddingFavorite}
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              {isAddingFavorite ? "追加中..." : "お気に入りに追加"}
            </button>
            
            <button
              onClick={onDeepResearch}
              className="nordic-button nordic-button-secondary flex items-center"
            >
              <MagnifyingGlassIcon className="h-5 w-5 mr-1" />
              DeepResearch
            </button>

            <button
              onClick={onLoadRandomDapp}
              className="nordic-button nordic-button-secondary flex items-center"
              title="Show another dApp"
            >
              <ArrowPathIcon className="h-5 w-5 mr-1" />
              Next dApp
            </button>

            <button
              onClick={handleShare}
              className="nordic-button nordic-button-secondary flex items-center"
            >
              <ShareIcon className="h-5 w-5 mr-1" />
              共有
            </button>

            <button
              onClick={() => setIsQRCodeModalOpen(true)}
              className="nordic-button nordic-button-secondary flex items-center"
            >
              <QrCodeIcon className="h-5 w-5 mr-1" />
              QRコード
            </button>

            {dapp?.website && (
              <button
                onClick={() => window.open(dapp.website, '_blank')}
                className="nordic-button nordic-button-secondary flex items-center"
                title="Open website"
              >
                <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-1" />
                Visit Website
              </button>
            )}
          </div>
        </div>
      </div>

      {memoizedStats}

      {dapp?.tags && dapp.tags.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {dapp.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <QRCodeModal
        isOpen={isQRCodeModalOpen}
        onClose={() => setIsQRCodeModalOpen(false)}
        dapp={dapp}
      />
      
      <TextListModal
        isOpen={isTextListModalOpen}
        onClose={() => setIsTextListModalOpen(false)}
        dapp={dapp}
      />
      
      <ShareExperienceModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        dapp={dapp}
        shareOptions={shareOptions}
        onOptionSelect={handleShareOptionSelect}
      />
    </div>
  );
};

export default React.memo(DiscoveryPanel);
