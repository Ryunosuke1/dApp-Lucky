import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { DApp } from "@/types/dapp";
import { shareTextSchema } from "@shared/schema";
import { Copy } from "lucide-react";

interface TextListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TextListModal({ isOpen, onClose }: TextListModalProps) {
  const { toast } = useToast();
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>(["#DeFi", "#Web3"]);
  
  const { data: favorites } = useQuery({
    queryKey: ['/api/favorites'],
  });
  
  const form = useForm({
    resolver: zodResolver(shareTextSchema),
    defaultValues: {
      comment: "",
      hashtags: ["#DeFi", "#Web3"]
    },
  });
  
  const generateTextList = () => {
    if (!favorites || favorites.length === 0) {
      return "My Favorite dApps:\n\nNo favorites yet!";
    }
    
    const comment = form.getValues().comment;
    
    let text = "My Favorite dApps:\n\n";
    
    favorites.forEach((favorite: any, index: number) => {
      const dapp = favorite.dappData as DApp;
      text += `${index + 1}. ${dapp.name} (${dapp.website || "no website"})${dapp.category ? ` - ${dapp.category}` : ""}\n`;
    });
    
    if (comment) {
      text += `\n${comment}\n`;
    }
    
    if (selectedHashtags.length > 0) {
      text += `\n${selectedHashtags.join(" ")} #dAppExplorer`;
    }
    
    return text;
  };
  
  const textList = generateTextList();
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(textList).then(
      () => {
        toast({
          title: "Copied to clipboard",
          description: "Your dApp list has been copied to the clipboard.",
        });
      },
      () => {
        toast({
          title: "Copy failed",
          description: "Failed to copy to clipboard. Please try again.",
          variant: "destructive",
        });
      }
    );
  };
  
  const toggleHashtag = (hashtag: string) => {
    if (selectedHashtags.includes(hashtag)) {
      setSelectedHashtags(selectedHashtags.filter(h => h !== hashtag));
    } else {
      setSelectedHashtags([...selectedHashtags, hashtag]);
    }
  };
  
  const availableHashtags = ["#DeFi", "#NFT", "#GameFi", "#Web3", "#Ethereum", "#Social"];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Your dApp Collection</DialogTitle>
          <DialogDescription>
            Copy and share your favorite dApps with others.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Comment</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="These are my go-to dApps for..."
                      onChange={(e) => {
                        field.onChange(e);
                        // Force re-render to update text
                        form.setValue("comment", e.target.value);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">
                Add hashtags
              </Label>
              <div className="flex flex-wrap gap-2">
                {availableHashtags.map((hashtag) => (
                  <Badge
                    key={hashtag}
                    variant={selectedHashtags.includes(hashtag) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary-200"
                    onClick={() => toggleHashtag(hashtag)}
                  >
                    {hashtag}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="textListOutput" className="block text-sm font-medium text-gray-700 mb-1">
                Generated Text
              </Label>
              <Textarea
                id="textListOutput"
                value={textList}
                rows={8}
                readOnly
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </form>
        </Form>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            onClick={handleCopyToClipboard}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy to Clipboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
