import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";
import { DApp } from "@/types/dapp";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DeepResearchPanelProps {
  dapp: DApp;
  onClose: () => void;
}

export function DeepResearchPanel({ dapp, onClose }: DeepResearchPanelProps) {
  const { toast } = useToast();
  const [research, setResearch] = useState<{
    overview?: string;
    features?: string[];
    developments?: { date: string; description: string }[];
    sentiment?: { positive: number; count: number };
  } | null>(null);
  
  const researchMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/research", {
        dappName: dapp.name,
        dappDescription: dapp.description,
      });
      return response.json();
    },
    onSuccess: (data) => {
      try {
        // Try to parse the research content
        // This is a simplified parser - in production you'd want more robust parsing
        const sections = data.research.split('\n\n');
        
        const researchData: any = {};
        
        // Overview is typically the first section
        researchData.overview = sections[0];
        
        // Look for features
        const featuresSection = sections.find(s => s.toLowerCase().includes('features') || s.toLowerCase().includes('capabilities'));
        if (featuresSection) {
          const features = featuresSection.split('\n')
            .filter((line: string) => line.trim().startsWith('- ') || line.trim().startsWith('• '))
            .map((line: string) => line.trim().replace(/^[-•]\s+/, ''));
          
          if (features.length > 0) {
            researchData.features = features;
          }
        }
        
        // Look for recent developments
        const developmentsSection = sections.find(s => 
          s.toLowerCase().includes('developments') || 
          s.toLowerCase().includes('updates') || 
          s.toLowerCase().includes('news')
        );
        
        if (developmentsSection) {
          const developmentItems = developmentsSection.split('\n')
            .filter((line: string) => /^\d{4}|^\w+ \d{4}|^\w+,? \d{4}/.test(line.trim()))
            .map((line: string) => {
              const parts = line.split(':');
              if (parts.length >= 2) {
                return {
                  date: parts[0].trim(),
                  description: parts.slice(1).join(':').trim()
                };
              }
              return null;
            })
            .filter(Boolean);
          
          if (developmentItems.length > 0) {
            researchData.developments = developmentItems;
          }
        }
        
        // Extract sentiment
        const sentimentMatch = data.research.match(/(\d+)%\s+[Pp]ositive/);
        if (sentimentMatch) {
          researchData.sentiment = {
            positive: parseInt(sentimentMatch[1]),
            count: 0 // Default
          };
          
          // Try to find the count
          const countMatch = data.research.match(/based on (\d+)/i);
          if (countMatch) {
            researchData.sentiment.count = parseInt(countMatch[1]);
          }
        }
        
        setResearch(researchData);
      } catch (error) {
        console.error("Error parsing research response:", error);
        setResearch({
          overview: data.research
        });
      }
    },
    onError: () => {
      toast({
        title: "Research Failed",
        description: "Unable to perform deep research. Please try again later.",
        variant: "destructive",
      });
    }
  });
  
  useEffect(() => {
    researchMutation.mutate();
  }, [dapp.id]); // eslint-disable-line react-hooks/exhaustive-deps
  
  return (
    <div className="p-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 heading">Deep Research</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <Card className="bg-gray-50 rounded-xl p-4">
        {researchMutation.isPending ? (
          <div className="space-y-4">
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
        ) : (
          <>
            {research ? (
              <div>
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Overview</h4>
                  <p className="text-gray-600">
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
                        <div key={index}>
                          <span className="text-xs text-gray-500">{dev.date}</span>
                          <p className="text-gray-600">{dev.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {research.sentiment && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Community Sentiment</h4>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                        <Progress value={research.sentiment.positive} className="h-2.5" />
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        {research.sentiment.positive}% Positive
                      </span>
                    </div>
                    {research.sentiment.count > 0 && (
                      <p className="mt-2 text-sm text-gray-600">
                        Based on {research.sentiment.count} recent social media mentions and forum discussions.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500">No research data available</p>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
