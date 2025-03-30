import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { DApp } from '@/types/dapp';

interface TextListModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites?: DApp[];
  dapp?: DApp;
  triggerRef?: React.RefObject<HTMLElement>;
}

const TextListModal: React.FC<TextListModalProps> = ({ 
  isOpen, 
  onClose, 
  favorites = [], // デフォルト値を設定して、undefinedを防ぐ
  dapp,
  triggerRef 
}) => {
  const [copied, setCopied] = useState(false);
  const [animationOrigin, setAnimationOrigin] = useState({ x: 0, y: 0 });
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      
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
  }, [isOpen, triggerRef]);

  const generateTextList = () => {
    if (favorites.length === 0 && !dapp) return '';

    const header = '🔍 My Favorite dApps 🔍\n\n';
    
    const dappList = favorites.map((dapp, index) => {
      const number = index + 1;
      const name = dapp.name;
      const category = dapp.category ? ` (${dapp.category})` : '';
      const url = dapp.website || '';
      
      return `${number}. ${name}${category}${url ? ` - ${url}` : ''}`;
    }).join('\n');

    const hashtags = '\n\n#dAppExplorer #Web3 #Blockchain ' + 
      favorites.map(dapp => `#${dapp.name.replace(/\s+/g, '')}`).join(' ');
    
    return header + dappList + hashtags;
  };

  const handleCopy = () => {
    if (textAreaRef.current) {
      textAreaRef.current.select();
      document.execCommand('copy');
      setCopied(true);
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
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
                  Share Favorites as Text
                </Dialog.Title>
                
                <div className="mt-4">
                  {favorites.length === 0 && !dapp ? (
                    <p className="text-gray-500">You don't have any favorites to share.</p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500 mb-2">
                        Copy this text to share your favorite dApps on social media:
                      </p>
                      <div className="relative">
                        <label htmlFor="share-text" className="sr-only">
                          Shareable text content
                        </label>
                        <textarea
                          id="share-text"
                          ref={textAreaRef}
                          className="w-full h-48 p-3 border border-gray-300 rounded-md text-sm"
                          value={generateTextList()}
                          readOnly
                          aria-label="Favorite dApps list text content"
                          aria-readonly="true"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="nordic-button nordic-button-secondary"
                    onClick={onClose}
                    aria-label="Close modal"
                  >
                    Close
                  </button>
                  {favorites.length > 0 && (
                      <button
                        type="button"
                        className="nordic-button nordic-button-primary"
                        onClick={handleCopy}
                        aria-label={copied ? "Text copied to clipboard" : "Copy text to clipboard"}
                      >
                      {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default TextListModal;
