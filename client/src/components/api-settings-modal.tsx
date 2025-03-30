import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useApiSettings } from '@/hooks/use-api-settings';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement>;
}

const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({ isOpen, onClose, triggerRef }) => {
  const { settings, updateSettings } = useApiSettings();
  const [activeTab, setActiveTab] = useState<'openai' | 'dappradar'>('openai');
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState('');
  const [openaiModel, setOpenaiModel] = useState('');
  const [dappradarKey, setDappradarKey] = useState('');
  const [animationOrigin, setAnimationOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setOpenaiKey(settings.openai.apiKey || '');
      setOpenaiBaseUrl(settings.openai.baseUrl || '');
      setOpenaiModel(settings.openai.model || '');
      setDappradarKey(settings.dappradar.apiKey || '');
      
      // Set animation origin based on trigger button position
      if (triggerRef && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setAnimationOrigin({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      } else {
        // Default to center of screen if no trigger ref
        setAnimationOrigin({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        });
      }
    }
  }, [isOpen, settings, triggerRef]);

  const handleSave = () => {
    updateSettings({
      openai: {
        apiKey: openaiKey,
        baseUrl: openaiBaseUrl || 'https://api.openai.com/v1',
        model: openaiModel || 'gpt-3.5-turbo'
      },
      dappradar: {
        apiKey: dappradarKey
      }
    });
    onClose();
  };

  const modelOptions = [
    { value: 'gpt-3.5-turbo', label: 'OpenAI GPT-3.5 Turbo' },
    { value: 'gpt-4', label: 'OpenAI GPT-4' },
    { value: 'gpt-4-turbo', label: 'OpenAI GPT-4 Turbo' },
    { value: 'google/gemma-3-27b-it:free', label: 'Google Gemma 3 27B-IT' },
    { value: 'anthropic/claude-3-opus:beta', label: 'Anthropic Claude 3 Opus' },
    { value: 'anthropic/claude-3-sonnet:beta', label: 'Anthropic Claude 3 Sonnet' },
    { value: 'meta-llama/llama-3-70b-instruct:nitro', label: 'Meta Llama 3 70B' },
  ];

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-500"
              enterFrom={`opacity-0 scale-0`}
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-0"
              style={{
                transformOrigin: `${animationOrigin.x}px ${animationOrigin.y}px`
              }}
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
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
                  API Settings
                </Dialog.Title>
                <p className="mt-2 text-sm text-gray-500">
                  Configure API settings for DeepResearch and DappRadar integration.
                </p>

                <div className="mt-4">
                  <div className="flex border-b">
                    <button
                      className={`px-4 py-2 font-medium ${
                        activeTab === 'openai'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('openai')}
                    >
                      OpenAI / LLM
                    </button>
                    <button
                      className={`px-4 py-2 font-medium ${
                        activeTab === 'dappradar'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('dappradar')}
                    >
                      DappRadar
                    </button>
                  </div>

                  <div className="mt-4">
                    {activeTab === 'openai' ? (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="openai-key" className="block text-sm font-medium text-gray-700">
                            API Key
                          </label>
                          <input
                            type="text"
                            id="openai-key"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="sk-..."
                            value={openaiKey}
                            onChange={(e) => setOpenaiKey(e.target.value)}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Enter OpenAI API key or OpenRouter API key.
                          </p>
                        </div>
                        
                        <div>
                          <label htmlFor="openai-model" className="block text-sm font-medium text-gray-700">
                            Model
                          </label>
                          <select
                            id="openai-model"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={openaiModel}
                            onChange={(e) => setOpenaiModel(e.target.value)}
                          >
                            <option value="">Select a model</option>
                            {modelOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-gray-500">
                            Select the model to use for DeepResearch.
                          </p>
                        </div>

                        <div>
                          <label htmlFor="openai-base-url" className="block text-sm font-medium text-gray-700">
                            Base URL (Optional)
                          </label>
                          <input
                            type="text"
                            id="openai-base-url"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="https://api.openai.com/v1"
                            value={openaiBaseUrl}
                            onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Leave empty for OpenAI. For OpenRouter, use "https://openrouter.ai/api/v1".
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label htmlFor="dappradar-key" className="block text-sm font-medium text-gray-700">
                          API Key
                        </label>
                        <input
                          type="text"
                          id="dappradar-key"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Enter DappRadar API key"
                          value={dappradarKey}
                          onChange={(e) => setDappradarKey(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="nordic-button nordic-button-secondary"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="nordic-button nordic-button-primary"
                    onClick={handleSave}
                  >
                    Save
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ApiSettingsModal;
