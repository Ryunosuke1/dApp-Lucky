import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { shareExperienceSchema } from "@shared/schema";
import { DApp } from "@/types/dapp";
import { Star } from "lucide-react";

interface ShareExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  dapp: DApp | null;
}

export function ShareExperienceModal({ isOpen, onClose, dapp }: ShareExperienceModalProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(4);
  
  const form = useForm({
    resolver: zodResolver(shareExperienceSchema),
    defaultValues: {
      dappId: dapp?.id || "",
      dappName: dapp?.name || "",
      content: "",
      rating: 4
    },
  });
  
  // Update form values when dapp changes
  useEffect(() => {
    if (dapp) {
      form.setValue("dappId", dapp.id);
      form.setValue("dappName", dapp.name);
    }
  }, [dapp, form]);
  
  const shareMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/experiences", {
        dappId: data.dappId,
        content: data.content,
        rating: data.rating
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/experiences/${dapp?.id}`] });
      toast({
        title: "Experience shared",
        description: "Thank you for sharing your experience!",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to share experience. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: any) => {
    shareMutation.mutate(data);
  };
  
  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    form.setValue("rating", newRating);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Your Experience</DialogTitle>
          <DialogDescription>
            Share how you've used this dApp and what you liked or disliked
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dappName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>dApp Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Experience</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Share how you've used this dApp, what you liked or disliked..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Button
                            key={star}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={`p-0 ${star <= rating ? 'text-amber-500' : 'text-gray-300'}`}
                            onClick={() => handleRatingChange(star)}
                          >
                            <Star className="h-5 w-5" fill={star <= rating ? 'currentColor' : 'none'} />
                          </Button>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">{rating}/5</span>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={shareMutation.isPending}
              >
                {shareMutation.isPending ? "Submitting..." : "Submit Experience"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
