import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Tab } from '@headlessui/react';
import type { DApp } from '../../../shared/schema';
import { DeepResearchOutput } from '@/lib/deep-research-service';
import { useApiSettings } from '@/hooks/use-api-settings';
import { createDeepResearchService } from '@/lib/deep-research-service';
import { ArrowDownTrayIcon, ExclamationTriangleIcon, ShieldCheckIcon, ShieldExclamationIcon, HeartIcon, ShareIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { addFavorite, loadFavoritesFromMetaMask } from '@/lib/metamask-service';
import ApiSettingsModal from './api-settings-modal';

interface DeepResearchPanelProps {
  dapp: DApp;
  isOpen: boolean;
  triggerRef?: React.RefObject<HTMLElement>;
  onShare?: () => void;
  onShowQr?: () => void;
}

interface TabClassNameProps {
  selected: boolean;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const DeepResearchPanel: React.FC<DeepResearchPanelProps> = ({ dapp, isOpen, triggerRef, onShare, onShowQr }) => {
  const { settings } = useApiSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<DeepResearchOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleAddToFavorites = useCallback(async () => {
    if (isAddingFavorite) return;
    setIsAddingFavorite(true);
    try {
      const favorites = await loadFavoritesFromMetaMask();
      await addFavorite(dapp, favorites || []);
      setIsFavorite(true);
    } catch (error) {
      console.error('Error adding to favorites:', error);
    } finally {
      setIsAddingFavorite(false);
    }
  }, [dapp, isAddingFavorite]);

  const downloadReport = useCallback(() => {
    if (!result) return;
    const jsonString = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dapp.name}-deep-research.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result, dapp.name]);

  const performDeepResearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setProgress(0);
    try {
      const service = createDeepResearchService(settings);
      const result = await service.analyze(dapp, {
        onProgress: (progress, status) => {
          setProgress(progress);
          setStatus(status);
        }
      });
      setResult(result);
    } catch (error) {
      console.error('Deep research error:', error);
      setError(error instanceof Error ? error.message : '分析中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [dapp, settings]);

  useEffect(() => {
    if (isOpen && !result && !isLoading) {
      performDeepResearch();
    }
  }, [isOpen, result, isLoading, performDeepResearch]);

  // アニメーション計算の最適化
  useEffect(() => {
    if (isOpen && triggerRef?.current && panelRef.current) {
      const trigger = triggerRef.current.getBoundingClientRect();
      const panel = panelRef.current.getBoundingClientRect();
      
      requestAnimationFrame(() => {
        const triggerCenterX = trigger.left + trigger.width / 2;
        const triggerCenterY = trigger.top + trigger.height / 2;
        const panelCenterX = panel.left + panel.width / 2;
        const panelCenterY = panel.top + panel.height / 2;
        
        const translateX = triggerCenterX - panelCenterX;
        const translateY = triggerCenterY - panelCenterY;
        
        panelRef.current?.style.setProperty('--animation-translate-x', `${translateX}px`);
        panelRef.current?.style.setProperty('--animation-translate-y', `${translateY}px`);
        panelRef.current?.style.setProperty('--animation-scale', '0.1');
      });
    }
  }, [isOpen, triggerRef]);

  const memoizedTabs = useMemo(() => (
    <Tab.Group>
      <Tab.List className="nordic-tabs">
        {['Overview', 'Features & Development', 'Market Analysis', 'Technical & Security', 'Investment & Risks'].map((tab) => (
          <Tab
            key={tab}
            className={({ selected }) =>
              classNames(
                'nordic-tab',
                selected ? 'nordic-tab-active' : ''
              )
            }
          >
            {tab}
          </Tab>
        ))}
      </Tab.List>
    </Tab.Group>
  ), []);

  const memoizedLoadingIndicator = useMemo(() => (
    isLoading && (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{status}</span>
          <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
        </div>
        <div className="nordic-progress-bar">
          <div 
            className="nordic-progress-bar-fill transition-all duration-300 ease-in-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    )
  ), [isLoading, status, progress]);

  if (!isOpen) return null;

  return (
    <div 
      ref={panelRef}
      className="mt-6 nordic-card p-6 animate-dialog-expand will-change-transform"
      style={{
        '--animation-duration': '300ms',
        '--animation-timing': 'cubic-bezier(0.16, 1, 0.3, 1)'
      } as React.CSSProperties}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">DeepResearch: {dapp.name}</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleAddToFavorites}
            disabled={isFavorite || isAddingFavorite}
            className={`nordic-button ${isFavorite ? 'bg-pink-100 text-pink-600' : 'nordic-button-secondary'} flex items-center`}
          >
            <HeartIcon className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          {onShare && (
            <button
              onClick={onShare}
              className="nordic-button nordic-button-secondary flex items-center"
            >
              <ShareIcon className="h-5 w-5" />
            </button>
          )}
          {onShowQr && (
            <button
              onClick={onShowQr}
              className="nordic-button nordic-button-secondary flex items-center"
            >
              <QrCodeIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {memoizedLoadingIndicator}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <button 
            onClick={performDeepResearch}
            className="mt-2 nordic-button nordic-button-secondary"
          >
            Try Again
          </button>
        </div>
      )}

      {result && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={downloadReport}
              className="nordic-button nordic-button-secondary flex items-center"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Download Report
            </button>
          </div>

          {memoizedTabs}

          <Tab.Panels className="mt-4">
            <Tab.Panel className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Overview</h3>
                <p className="mt-1 text-gray-600">{result.overview}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">Community Sentiment</h3>
                <div className="mt-2 flex items-center">
                  <div className="nordic-progress-bar w-full mr-2">
                    <div 
                      className="bg-green-500 h-full rounded-full" 
                      style={{ width: `${result.sentiment.positive}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{result.sentiment.positive}% Positive</span>
                </div>
                {result.sentiment.count && (
                  <p className="mt-1 text-sm text-gray-500">Based on analysis of {result.sentiment.count} sources</p>
                )}
              </div>

              {result.communityInsights && result.communityInsights.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Community Insights</h3>
                  <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600">
                    {result.communityInsights.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Tab.Panel>
            
            <Tab.Panel className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Key Features</h3>
                <ul className="mt-2 space-y-2 list-disc list-inside text-gray-600">
                  {result.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">Recent Developments</h3>
                <div className="mt-2 space-y-3">
                  {result.developments.map((dev, index) => (
                    <div key={index} className="flex">
                      <div className="flex-shrink-0 w-24 text-sm font-medium text-gray-500">{dev.date}</div>
                      <div className="ml-2 text-gray-600">{dev.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Tab.Panel>
            
            <Tab.Panel className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Main Competitors</h3>
                <ul className="mt-2 space-y-2 list-disc list-inside text-gray-600">
                  {result.competitors.map((competitor, index) => (
                    <li key={index}>{competitor}</li>
                  ))}
                </ul>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium text-green-600">Strengths</h3>
                  <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600">
                    {result.strengths.map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-red-600">Weaknesses</h3>
                  <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600">
                    {result.weaknesses.map((weakness, index) => (
                      <li key={index}>{weakness}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">Future Outlook</h3>
                <p className="mt-2 text-gray-600">{result.futureOutlook}</p>
              </div>
            </Tab.Panel>
            
            <Tab.Panel className="space-y-4">
              {result.technicalAnalysis && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Technical Analysis</h3>
                  <p className="mt-2 text-gray-600">{result.technicalAnalysis}</p>
                </div>
              )}
              
              {result.securityAudit && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Security Audit Status</h3>
                  <div className="mt-2 p-4 rounded-lg border flex items-start">
                    {result.securityAudit.status === 'audited' ? (
                      <ShieldCheckIcon className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                    ) : result.securityAudit.status === 'not_audited' ? (
                      <ShieldExclamationIcon className="h-6 w-6 text-yellow-500 mr-2 flex-shrink-0" />
                    ) : (
                      <ExclamationTriangleIcon className="h-6 w-6 text-gray-400 mr-2 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">
                        {result.securityAudit.status === 'audited' 
                          ? 'Audited' 
                          : result.securityAudit.status === 'not_audited' 
                            ? 'Not Audited' 
                            : 'Unknown Status'}
                      </p>
                      <p className="text-gray-600">{result.securityAudit.details}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {result.additionalResources && result.additionalResources.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Additional Resources</h3>
                  <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600">
                    {result.additionalResources.map((resource, index) => (
                      <li key={index}>
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {resource.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Tab.Panel>
            
            <Tab.Panel className="space-y-4">
              {result.investmentPotential && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Investment Potential</h3>
                  <div className="mt-2 p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center mb-2">
                      <div className={classNames(
                        "h-8 w-8 rounded-full flex items-center justify-center mr-3",
                        result.investmentPotential.rating === 'high' ? 'bg-green-100 text-green-600' :
                        result.investmentPotential.rating === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                      )}>
                        <span className="font-semibold text-sm">
                          {result.investmentPotential.rating.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {result.investmentPotential.rating.charAt(0).toUpperCase() + result.investmentPotential.rating.slice(1)} Investment Potential
                      </span>
                    </div>
                    <p className="text-gray-600">{result.investmentPotential.reasoning}</p>
                  </div>
                </div>
              )}

              {result.riskFactors && result.riskFactors.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900">Risk Factors</h3>
                  <ul className="mt-2 space-y-2 list-disc list-inside text-gray-600">
                    {result.riskFactors.map((risk, index) => (
                      <li key={index} className="flex items-start">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Tab.Panel>
          </Tab.Panels>
        </div>
      )}
    </div>
  );
};

export default React.memo(DeepResearchPanel);