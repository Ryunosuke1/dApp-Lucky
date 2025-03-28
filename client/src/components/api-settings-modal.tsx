import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Interface for API settings
export interface ApiSettings {
  baseUrl: string;
  apiKey: string;
  modelName: string;
}

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings: ApiSettings;
  onSave: (settings: ApiSettings) => void;
}

export function ApiSettingsModal({
  isOpen,
  onClose,
  initialSettings,
  onSave,
}: ApiSettingsModalProps) {
  const [settings, setSettings] = useState<ApiSettings>(initialSettings);
  const { toast } = useToast();

  const handleSave = () => {
    // Validate settings
    if (!settings.baseUrl || !settings.apiKey || !settings.modelName) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // If baseUrl doesn't end with a slash, add it
    let baseUrl = settings.baseUrl;
    if (baseUrl && !baseUrl.endsWith("/")) {
      baseUrl += "/";
    }

    // Save to localStorage
    const updatedSettings = {
      ...settings,
      baseUrl,
    };
    
    onSave(updatedSettings);
    
    toast({
      title: "Settings Saved",
      description: "Your API settings have been saved",
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>API Settings</DialogTitle>
          <DialogDescription>
            Configure your OpenAI-compatible API settings. These settings will be stored in your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="baseUrl" className="text-right">
              Base URL
            </Label>
            <Input
              id="baseUrl"
              placeholder="https://api.openai.com/v1"
              className="col-span-3"
              value={settings.baseUrl}
              onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiKey" className="text-right">
              API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              className="col-span-3"
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="modelName" className="text-right">
              Model Name
            </Label>
            <Input
              id="modelName"
              placeholder="gpt-3.5-turbo"
              className="col-span-3"
              value={settings.modelName}
              onChange={(e) => setSettings({ ...settings, modelName: e.target.value })}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}