import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp } from "lucide-react";
import { Experience } from "@shared/schema";

interface CommunityExperiencesProps {
  dappId?: string;
  onShareExperience: () => void;
}

export function CommunityExperiences({ dappId, onShareExperience }: CommunityExperiencesProps) {
  const [expandedExperiences, setExpandedExperiences] = useState(false);
  
  const { data: experiences, isLoading } = useQuery({
    queryKey: dappId ? [`/api/experiences/${dappId}`] : null,
    enabled: !!dappId,
  });
  
  const displayExperiences = expandedExperiences ? experiences : experiences?.slice(0, 2);
  
  const handleLike = (experienceId: number) => {
    // In a real app, this would call an API to like the experience
    console.log(`Liked experience ${experienceId}`);
  };
  
  return (
    <div className="p-6 border-t border-gray-200 nordic-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 heading">Community Experiences</h3>
        <Button 
          variant="ghost" 
          className="text-primary-500 hover:text-primary-600 hover:bg-transparent"
          onClick={onShareExperience}
        >
          Share your experience
        </Button>
      </div>
      
      <div className="space-y-4">
        {isLoading ? (
          <>
            <ExperienceSkeleton />
            <ExperienceSkeleton />
          </>
        ) : !experiences || experiences.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-gray-500 mb-3">No experiences shared yet</p>
            <Button onClick={onShareExperience}>Be the first to share</Button>
          </div>
        ) : (
          <>
            {displayExperiences?.map((experience: Experience) => (
              <div key={experience.id} className="bg-gray-50 rounded-xl p-4 nordic-card">
                <div className="flex items-start">
                  <Avatar className="h-10 w-10 rounded-full bg-primary-100 text-primary-600">
                    <AvatarFallback>
                      {nameToInitials(experience.id.toString())}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">User {experience.id}</h4>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(experience.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-600">{experience.content}</p>
                    <div className="mt-2 flex items-center text-sm">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-500 hover:text-gray-700 p-0 h-auto"
                        onClick={() => handleLike(experience.id)}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        <span>{Math.floor(Math.random() * 30)}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-4 text-gray-500 hover:text-gray-700 p-0 h-auto"
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      
      {experiences && experiences.length > 2 && (
        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setExpandedExperiences(!expandedExperiences)}
          >
            {expandedExperiences ? "Show less" : "Show more experiences"}
          </Button>
        </div>
      )}
    </div>
  );
}

function nameToInitials(name: string): string {
  // Simple function to generate initials - in a real app you'd use the user's name
  const initials = ["J", "A", "M", "S", "R", "T", "D", "L", "E"];
  const randomInitial = initials[Math.floor(Math.random() * initials.length)];
  return randomInitial;
}

function ExperienceSkeleton() {
  return (
    <div className="bg-gray-50 rounded-xl p-4 nordic-card">
      <div className="flex items-start">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-1 h-4 w-full" />
          <Skeleton className="mt-1 h-4 w-2/3" />
          <div className="mt-2 flex items-center">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="ml-4 h-5 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
