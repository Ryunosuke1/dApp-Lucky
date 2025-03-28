import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";
import { Download } from "lucide-react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeModal({ isOpen, onClose }: QRCodeModalProps) {
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { data: favorites, isLoading } = useQuery({
    queryKey: ['/api/favorites'],
  });
  
  useEffect(() => {
    if (isOpen && favorites && favorites.length > 0 && !isLoading) {
      generateQRCode();
    }
  }, [isOpen, favorites, isLoading]);
  
  const generateQRCode = async () => {
    if (!favorites || favorites.length === 0) return;
    
    setIsGenerating(true);
    
    try {
      // Create a JSON object with the favorites data
      const favoritesData = favorites.map((favorite: any) => ({
        id: favorite.dappData.id,
        name: favorite.dappData.name,
        website: favorite.dappData.website,
        category: favorite.dappData.category
      }));
      
      // Create a serialized version
      const dataString = JSON.stringify({
        type: "dapp-explorer-favorites",
        data: favoritesData
      });
      
      // Generate QR code
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, dataString, {
          width: 256,
          margin: 2,
          color: {
            dark: "#1E3A8A", // primary-900
            light: "#FFFFFF" // white
          }
        });
        
        // Convert canvas to data URL
        const dataUrl = canvasRef.current.toDataURL("image/png");
        setQrCodeUrl(dataUrl);
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleDownload = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = "dapp-favorites-qrcode.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "QR Code Downloaded",
      description: "Your collection QR code has been downloaded.",
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Collection QR Code</DialogTitle>
          <DialogDescription>
            Share this QR code to let others import your collection.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center my-4">
          {isLoading || isGenerating ? (
            <Skeleton className="h-64 w-64 rounded-lg" />
          ) : !favorites || favorites.length === 0 ? (
            <div className="h-64 w-64 bg-gray-100 rounded-lg flex items-center justify-center text-center p-4">
              <p className="text-gray-500">No favorites to generate QR code</p>
            </div>
          ) : (
            <div className="bg-white p-2 border border-gray-200 rounded-lg">
              <canvas ref={canvasRef} className="h-64 w-64 rounded-lg" />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            onClick={handleDownload}
            disabled={!qrCodeUrl || isLoading || isGenerating}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
