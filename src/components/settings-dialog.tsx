'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";
import { getConfigAction, updateConfigAction } from "@/app/actions";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [provider, setProvider] = React.useState('openai');
  const [apiKey, setApiKey] = React.useState('');
  const [baseUrl, setBaseUrl] = React.useState('');
  const [model, setModel] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open]);

  const loadConfig = async () => {
    try {
      const res = await getConfigAction();
      if (res.success && res.config) {
        setProvider(res.config.aiProvider || 'openai');
        setApiKey(res.config.aiApiKey || '');
        setBaseUrl(res.config.aiBaseUrl || '');
        setModel(res.config.aiModel || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await updateConfigAction({
        aiProvider: provider,
        aiApiKey: apiKey,
        aiBaseUrl: baseUrl,
        aiModel: model,
      });

      if (res.success) {
        toast.success("Settings saved successfully.");
        onOpenChange(false);
      } else {
        toast.error("Failed to save settings.");
      }
    } catch (error) {
      toast.error("An error occurred while saving.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            AI Settings
          </DialogTitle>
          <DialogDescription>
            Configure your AI provider to enable smart summaries and assistance.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="provider" className="text-right">
              Provider
            </Label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="google">Google (Gemini)</option>
              <option value="ollama">Ollama (Local)</option>
              <option value="custom">Custom (OpenAI Compatible)</option>
            </select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiKey" className="text-right">
              API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="model" className="text-right">
              Model
            </Label>
            <Input
              id="model"
              placeholder={provider === 'openai' ? 'gpt-4o' : provider === 'ollama' ? 'llama3' : 'gemini-1.5-flash'}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="col-span-3"
            />
          </div>

          {(provider === 'ollama' || provider === 'custom') && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="baseUrl" className="text-right">
                Base URL
              </Label>
              <Input
                id="baseUrl"
                placeholder={provider === 'ollama' ? 'http://localhost:11434/api' : 'https://...'}
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="col-span-3"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isLoading} className="gap-2">
            <Save className="w-4 h-4" />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
