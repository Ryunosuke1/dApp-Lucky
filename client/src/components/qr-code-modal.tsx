import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { DApp } from '@/types/dapp';
import QRCode from 'qrcode';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites?: DApp[];
  dapp?: DApp;
  triggerRef?: React.RefObject<HTMLElement>;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ 
  isOpen, 
  onClose, 
  favorites, 
  dapp,
  triggerRef 
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [animationOrigin, setAnimationOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      generateQRCode();
      
      // アニメーションの原点を設定
      if (triggerRef?.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setAnimationOrigin({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      } else {
        setAnimationOrigin({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        });
      }
    }
  }, [isOpen, favorites]);

  const generateQRCode = async () => {
    if (favorites?.length === 0 && !dapp) return;

    try {
      // Create a data structure to represent favorites
      const favoritesData = {
        type: 'dapp-explorer-favorites',
        version: '1.0',
        favorites: favorites?.map(dapp => ({
          id: dapp.id,
          name: dapp.name,
          category: dapp.category,
          website: dapp.website,
          description: dapp.description?.substring(0, 100) // Limit description length
        })) || []
      };

      // Convert to JSON string
      const jsonData = JSON.stringify(favoritesData);
      
      // Generate QR code
      const dataUrl = await QRCode.toDataURL(jsonData, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 300,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
            </Transition.Child>

            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-4 scale-95"
            >
              <Dialog.Panel 
                className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all"
                style={{
                  transformOrigin: `${animationOrigin.x}px ${animationOrigin.y}px`
                }}
              >
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                  Share Favorites via QR Code
                </Dialog.Title>
                
                <div className="mt-4">
                  {favorites?.length === 0 ? (
                    <p className="text-gray-500">You don't have any favorites to share.</p>
                  ) : qrCodeDataUrl ? (
                    <div className="flex flex-col items-center">
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <img src={qrCodeDataUrl} alt="QR Code for favorites" className="w-64 h-64" />
                      </div>
                      <p className="mt-4 text-sm text-gray-500 text-center">
                        Scan this QR code with another dApp Explorer user to share your favorites list.
                      </p>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <div className="animate-pulse bg-gray-200 w-64 h-64 rounded-lg"></div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="nordic-button nordic-button-secondary"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default QRCodeModal;
