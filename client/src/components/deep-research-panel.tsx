import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { X, Settings, Zap } from "lucide-react";
import { DApp } from "@/types/dapp";
import { useToast } from "@/hooks/use-toast";
import { performResearch, ResearchResponse } from "@/lib/openrouter-service";
import { ApiSettings } from "./api-settings-modal";
import { DeepResearchOutput } from "@/lib/langchain-research";

interface DeepResearchPanelProps {
  dapp: DApp;
  onClose: () => void;
  apiSettings: ApiSettings;
}

export function DeepResearchPanel({ dapp, onClose, apiSettings }: DeepResearchPanelProps) {
  const { toast } = useToast();
  const [research, setResearch] = useState<{
    overview?: string;
    features?: string[];
    developments?: { date: string; description: string }[];
    sentiment?: { positive: number; count?: number };
    competitors?: string[];
    strengths?: string[];
    weaknesses?: string[];
    futureOutlook?: string;
    useClientApi?: boolean;
  } | null>(null);
  
  // Progress tracking for research (0-100)
  const [researchProgress, setResearchProgress] = useState<number>(0);
  const [researchStage, setResearchStage] = useState<string>("");
  
  const researchMutation = useMutation({
    mutationFn: async () => {
      // Reset progress
      setResearchProgress(5);
      setResearchStage("準備中...");
      
      // Simulate gradual progress updates
      const progressInterval = setInterval(() => {
        setResearchProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          
          // Update the research stage based on progress
          if (prev === 5) {
            setResearchStage("初期分析中...");
          } else if (prev === 25) {
            setResearchStage("機能の評価中...");
          } else if (prev === 45) {
            setResearchStage("市場分析中...");
          } else if (prev === 65) {
            setResearchStage("コミュニティの評判を計算中...");
          } else if (prev === 85) {
            setResearchStage("最終レポートを生成中...");
          }
          
          return prev + (20 * Math.random());
        });
      }, 2000);
      
      try {
        // Pass apiSettings (can be undefined) to let the service decide whether to use client or server API
        const result = await performResearch({
          dappName: dapp.name,
          dappDescription: dapp.description,
          category: dapp.category,
          chains: dapp.chains
        }, apiSettings?.apiKey && apiSettings.baseUrl ? apiSettings : undefined);
        
        // Set to 100% when done
        clearInterval(progressInterval);
        setResearchProgress(100);
        setResearchStage("完了！");
        
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        setResearchProgress(0);
        setResearchStage("エラーが発生しました");
        throw error;
      }
    },
    onSuccess: (data: ResearchResponse) => {
      try {
        console.log("Research data received:", data);
        
        // Check if we have structured data from LangChain
        if (data.structured) {
          console.log("Using structured data from LangChain");
          const structuredOutput = data.structured;
          
          const researchData = {
            overview: structuredOutput.overview || "No overview available",
            features: structuredOutput.features || [],
            developments: structuredOutput.developments || [],
            sentiment: structuredOutput.sentiment || { positive: 50, count: undefined },
            competitors: structuredOutput.competitors || [],
            strengths: structuredOutput.strengths || [],
            weaknesses: structuredOutput.weaknesses || [],
            futureOutlook: structuredOutput.futureOutlook,
            useClientApi: !!apiSettings?.apiKey
          };
          
          console.log("Structured research data ready:", researchData);
          setResearch(researchData);
          return;
        }
        
        // Fallback to older parser for unstructured data
        console.log("No structured data, parsing text response");
        // Try to parse the research content with improved parser
        const researchText = data.research.trim();
        
        // Split by sections using patterns like "# Section" or "## Section" or "Section:" or numbered lists "1. Section"
        const sectionPattern = /(?:^|\n)(?:#{1,3} |(\d+)\. |([A-Za-z ]+):)/g;
        
        // Alternative to matchAll for better TypeScript compatibility
        const sectionMatches: { index: number, text: string }[] = [];
        let match;
        while ((match = sectionPattern.exec(researchText)) !== null) {
          sectionMatches.push({ 
            index: match.index,
            text: match[0]
          });
        }
        
        // If we couldn't find sections with headings, try paragraphs
        const sections = sectionMatches.length > 1 
          ? sectionMatches.map((match, index) => {
              const startIdx = match.index;
              const endIdx = index < sectionMatches.length - 1 ? sectionMatches[index + 1].index : researchText.length;
              return researchText.substring(startIdx, endIdx).trim();
            })
          : researchText.split(/\n{2,}/); // Fall back to paragraph splitting
        
        const researchData: any = {
          useClientApi: !!apiSettings?.apiKey
        };
        
        // Find Overview section
        const overviewSection = sections.find(s => 
          s.toLowerCase().startsWith('overview') || 
          s.toLowerCase().startsWith('# overview') || 
          s.toLowerCase().startsWith('## overview') ||
          s.toLowerCase().startsWith('1. overview')
        );
        
        if (overviewSection) {
          // Extract text after the heading
          const cleanOverview = overviewSection.replace(/^(?:#{1,3} |(\d+)\. |)overview:?/i, '').trim();
          researchData.overview = cleanOverview;
        } else {
          // If no overview section found, use the first paragraph
          researchData.overview = sections[0];
        }
        
        // Find Key Features section
        const featuresSection = sections.find(s => 
          s.toLowerCase().includes('features') || 
          s.toLowerCase().includes('capabilities') ||
          s.toLowerCase().includes('key aspects')
        );
        
        if (featuresSection) {
          // Look for bullet points or numbered items
          const features = featuresSection.split('\n')
            .filter(line => /^\s*[-•*]|\d+\./.test(line.trim()))
            .map(line => line.trim().replace(/^\s*[-•*]\s*|\d+\.\s*/, ''));
          
          if (features.length > 0) {
            researchData.features = features;
          } else {
            // If no bullet points, just grab everything after the heading
            const cleanFeatures = featuresSection
              .replace(/^(?:#{1,3} |(\d+)\. |)(?:key |)features:?/i, '')
              .trim()
              .split(/\n+/);
            if (cleanFeatures.length > 0) {
              researchData.features = cleanFeatures;
            }
          }
        }
        
        // Find Recent Developments section
        const developmentsSection = sections.find(s => 
          s.toLowerCase().includes('developments') || 
          s.toLowerCase().includes('updates') || 
          s.toLowerCase().includes('news') ||
          s.toLowerCase().includes('timeline')
        );
        
        if (developmentsSection) {
          // Try to match patterns like "Month Year: Description" or "Month Year - Description"
          const devRegex = /(?:^|\n)(?:[-•*]|\d+\.|\s*)?((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|early|mid|late|q[1-4]|[12][0-9]{3})[a-z.,\s]*(?:20[0-9]{2})?)\s*[:-]\s*([^\n]+)/gi;
          
          // Alternative to matchAll for better TypeScript compatibility
          const devMatches: Array<RegExpExecArray> = [];
          let devMatch;
          while ((devMatch = devRegex.exec(developmentsSection)) !== null) {
            devMatches.push(devMatch);
          }
          
          if (devMatches.length > 0) {
            researchData.developments = devMatches.map(match => ({
              date: match[1].trim(),
              description: match[2].trim()
            }));
          }
        }
        
        // Extract sentiment data
        const sentimentRegex = /(\d+)%\s*(?:positive|favorable|approving)/i;
        const sentimentMatch = researchText.match(sentimentRegex);
        
        if (sentimentMatch) {
          researchData.sentiment = {
            positive: parseInt(sentimentMatch[1]),
            count: 0 // Default
          };
          
          // Try to find the count of mentions
          const countRegex = /(?:based on|from|across|analyzing)\s+(?:approximately\s+)?(\d+|a few|several|many|hundreds of|thousands of)/i;
          const countMatch = researchText.match(countRegex);
          
          if (countMatch) {
            const countText = countMatch[1].toLowerCase();
            // Convert text counts to numbers
            let count = 0;
            if (/^\d+$/.test(countText)) {
              count = parseInt(countText);
            } else if (countText.includes('few')) {
              count = 5;
            } else if (countText.includes('several')) {
              count = 10;
            } else if (countText.includes('many')) {
              count = 50;
            } else if (countText.includes('hundreds')) {
              count = 200;
            } else if (countText.includes('thousands')) {
              count = 1000;
            }
            
            if (count > 0) {
              researchData.sentiment.count = count;
            }
          }
        }
        
        console.log("Parsed research data:", researchData);
        setResearch(researchData);
      } catch (error) {
        console.error("Error parsing research response:", error);
        // Fallback to displaying the raw response
        setResearch({
          overview: data.research,
          useClientApi: !!apiSettings?.apiKey
        });
      }
    },
    onError: (error) => {
      console.error("Research error:", error);
      toast({
        title: "Research Failed",
        description: apiSettings?.apiKey
          ? "Unable to perform deep research with your API key. Please check your API settings and try again."
          : "Unable to perform deep research. Server might not have API keys configured. Try providing your own API key.",
        variant: "destructive",
      });
    }
  });
  
  // Function to retry research
  const retryResearch = () => {
    researchMutation.mutate();
  };
  
  useEffect(() => {
    researchMutation.mutate();
  }, [dapp.id]); // eslint-disable-line react-hooks/exhaustive-deps
  
  return (
    <div className="p-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-gray-900 heading">Deep Research</h3>
          {research?.useClientApi !== undefined && (
            <span className={`ml-2 text-xs px-2 py-1 rounded-full ${research.useClientApi ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              {research.useClientApi ? 'Client API' : 'Server API'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!researchMutation.isPending && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={retryResearch}
              disabled={researchMutation.isPending}
            >
              Retry
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <Card className="bg-gray-50 rounded-xl p-4">
        {researchMutation.isPending ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 mb-4">
              <Progress className="w-full h-2" value={researchProgress} />
              <p className="text-center text-sm text-gray-500 mb-4">
                <span className="font-medium">{researchStage}</span>
                <br />
                <span className="text-xs">{dapp.name}の調査中...</span>
              </p>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="pt-4 pb-2 border-b border-gray-200">
              <Skeleton className="h-5 w-32 mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div className="pt-2 pb-2 border-b border-gray-200">
              <Skeleton className="h-5 w-32 mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        ) : researchMutation.isError ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="text-red-500 mb-4 rounded-full bg-red-50 p-2">
              <X className="h-8 w-8" />
            </div>
            <p className="text-gray-700 font-medium mb-2">Research Failed</p>
            <p className="text-gray-500 mb-4">
              {apiSettings?.apiKey 
                ? "Unable to perform research with your API key. Check your settings." 
                : "Server API key may be missing. Try providing your own API key."}
            </p>
            <Button onClick={retryResearch}>Try Again</Button>
          </div>
        ) : (
          <>
            {research ? (
              <div>
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Overview</h4>
                  <p className="text-gray-600 whitespace-pre-line">
                    {research.overview || "No overview available."}
                  </p>
                </div>
                
                {research.features && research.features.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Key Features</h4>
                    <ul className="list-disc pl-5 text-gray-600 space-y-1">
                      {research.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {research.developments && research.developments.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Recent Developments</h4>
                    <div className="space-y-3">
                      {research.developments.map((dev, index) => (
                        <div key={index} className="mb-2">
                          <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {dev.date}
                          </span>
                          <p className="text-gray-600 mt-1">{dev.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {research.sentiment && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Community Sentiment</h4>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                        <Progress 
                          value={research.sentiment.positive} 
                          className={`h-2.5 ${
                            research.sentiment.positive > 70 ? 'bg-green-500' : 
                            research.sentiment.positive > 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`} 
                        />
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        {research.sentiment.positive}% Positive
                      </span>
                    </div>
                    {research.sentiment.count && research.sentiment.count > 0 && (
                      <p className="mt-2 text-sm text-gray-600">
                        Based on {research.sentiment.count} recent social media mentions and forum discussions.
                      </p>
                    )}
                  </div>
                )}

                {research.competitors && research.competitors.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Competitors</h4>
                    <ul className="list-disc pl-5 text-gray-600 space-y-1">
                      {research.competitors.map((competitor, index) => (
                        <li key={index}>{competitor}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {(research.strengths && research.strengths.length > 0) || (research.weaknesses && research.weaknesses.length > 0) ? (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Strengths & Weaknesses</h4>
                    
                    {research.strengths && research.strengths.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-green-700 mb-1">Strengths</h5>
                        <ul className="list-disc pl-5 text-gray-600 space-y-1">
                          {research.strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {research.weaknesses && research.weaknesses.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-amber-700 mb-1">Weaknesses</h5>
                        <ul className="list-disc pl-5 text-gray-600 space-y-1">
                          {research.weaknesses.map((weakness, index) => (
                            <li key={index}>{weakness}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}
                
                {research.futureOutlook && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Future Outlook</h4>
                    <p className="text-gray-600 whitespace-pre-line">
                      {research.futureOutlook}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-gray-200 text-center">
                  <span className="text-xs text-gray-500">
                    Research performed using {research.useClientApi ? 'client-side API with LangChain' : 'server-side API'}.
                  </span>
                  {research.useClientApi && <Zap className="h-3 w-3 text-amber-500" />}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500 mb-4">No research data available</p>
                <Button onClick={retryResearch}>Try Research Again</Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
