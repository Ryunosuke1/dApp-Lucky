import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { DApp } from '@/types/dapp';

interface ShareOption {
  name: string;
  url?: string;
  action?: () => Promise<void>;
}

interface ShareExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  dapp: DApp | null;
  triggerRef?: React.RefObject<HTMLButtonElement>;
  shareOptions?: ShareOption[];
  onOptionSelect?: (option: ShareOption) => Promise<void>;
}

const ShareExperienceModal: React.FC<ShareExperienceModalProps> = ({ 
  isOpen, 
  onClose, 
  dapp,
  triggerRef,
  shareOptions,
  onOptionSelect
}) => {
  const [experience, setExperience] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);
  const [animationOrigin, setAnimationOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setExperience('');
      setRating(0);
      setSubmitted(false);
      
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

  const handleSubmit = () => {
    console.log('Submitting experience:', {
      dapp: dapp?.name,
      rating,
      experience
    });
    
    setSubmitted(true);
    
    setTimeout(() => {
      onClose();
    }, 2000);
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
                    aria-label="Close modal"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                  {submitted ? 'Thank You!' : `Share Your Experience${dapp ? ` with ${dapp.name}` : ''}`}
                </Dialog.Title>
                
                <div className="mt-4">
                  {shareOptions ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Choose how to share:</p>
                      {shareOptions.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => onOptionSelect?.(option)}
                          className="w-full p-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                          aria-label={`Share via ${option.name}`}
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                  ) : submitted ? (
                    <div className="text-center py-4">
                      <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="mt-2 text-gray-600">Your experience has been shared successfully!</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rating
                        </label>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className={`p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500`}
                              aria-label={`Rate ${star} ${star === 1 ? 'star' : 'stars'}`}
                            >
                              <svg 
                                className={`h-8 w-8 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`} 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                          Your Experience
                        </label>
                        <textarea
                          id="experience"
                          rows={4}
                          className="w-full p-3 border border-gray-300 rounded-md text-sm"
                          placeholder="Share your thoughts and experience..."
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          aria-label="Share your experience"
                        />
                      </div>
                    </>
                  )}
                </div>

                {!submitted && (
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="nordic-button nordic-button-secondary"
                      onClick={onClose}
                      aria-label="Cancel sharing experience"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="nordic-button nordic-button-primary"
                      onClick={handleSubmit}
                      disabled={!rating || !experience.trim()}
                      aria-label="Submit experience"
                    >
                      Share Experience
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ShareExperienceModal;
