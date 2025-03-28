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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { availableModels } from "@/hooks/use-api-settings";
import { useAccount } from "wagmi";

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
  const { address, isConnected } = useAccount();
  
  // Helper templates for popular APIs
  const templates = [
    { name: "OpenAI", url: "https://api.openai.com/v1", models: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"] },
    { name: "OpenRouter", url: "https://openrouter.ai/api/v1", models: ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "mixtral-8x7b-32768"] },
    { name: "Custom", url: "", models: [] }
  ];
  
  const setApiTemplate = (templateName: string) => {
    const template = templates.find(t => t.name === templateName);
    if (template) {
      setSettings({
        ...settings,
        baseUrl: template.url,
        modelName: template.models.length > 0 ? template.models[0] : settings.modelName
      });
    }
  };

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
      description: isConnected 
        ? `API settings saved for wallet ${address?.slice(0, 6)}...` 
        : "API settings saved to browser storage",
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>API Settings</DialogTitle>
          <DialogDescription>
            Configure your OpenAI-compatible API settings. {isConnected 
              ? `Settings will be saved for your connected wallet (${address?.slice(0, 6)}...).`
              : 'Settings will be stored in your browser.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* API Provider Template Buttons */}
          <div className="flex gap-2 justify-center mb-2">
            {templates.map(template => (
              <Button 
                key={template.name}
                variant={settings.baseUrl === template.url ? "default" : "outline"}
                size="sm"
                onClick={() => setApiTemplate(template.name)}
                className="min-w-20"
              >
                {template.name}
              </Button>
            ))}
          </div>
          
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
              Model
            </Label>
            <div className="col-span-3">
              <Select 
                value={settings.modelName} 
                onValueChange={(value) => setSettings({ ...settings, modelName: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Model Name...</SelectItem>
                </SelectContent>
              </Select>
              
              {settings.modelName === "custom" && (
                <Input
                  id="customModelName"
                  placeholder="Enter custom model name"
                  className="mt-2"
                  onChange={(e) => setSettings({ ...settings, modelName: e.target.value })}
                />
              )}
              
              {settings.baseUrl.includes("openrouter") && !settings.modelName.includes("claude") && 
                !settings.modelName.includes("mixtral") && settings.modelName !== "custom" && (
                <p className="text-xs text-amber-500 mt-1 flex items-center">
                  <Info className="mr-1 h-3 w-3" />
                  Consider using Claude or Mixtral models with OpenRouter
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mb-4 mt-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
          <p className="mb-1 flex items-center"><Info className="mr-1 h-3 w-3" /> Settings are stored locally in your browser.</p>
          {isConnected ? (
            <p className="flex items-center"><Info className="mr-1 h-3 w-3" /> Connected wallet: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
          ) : (
            <p className="flex items-center"><Info className="mr-1 h-3 w-3" /> Connect a wallet to save settings per wallet.</p>
          )}
        </div>
        
        <DialogFooter className="flex justify-between items-center">
          <div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSettings(defaultSettings);
                toast({
                  title: "Settings Reset",
                  description: "API settings have been reset to defaults",
                });
              }}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              Reset
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Settings</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}