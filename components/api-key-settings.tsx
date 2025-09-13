"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Key, Save } from "lucide-react"

interface ApiKeySettingsProps {
  apiKey: string
  onApiKeyChange: (key: string) => void
}

export function ApiKeySettings({ apiKey, onApiKeyChange }: ApiKeySettingsProps) {
  const [tempKey, setTempKey] = useState(apiKey)
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    onApiKeyChange(tempKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Configuration
        </CardTitle>
        <CardDescription>Enter your OpenRouter API key to start chatting with AI models.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">OpenRouter API Key</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? "text" : "password"}
              placeholder="sk-or-v1-..."
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <Button onClick={handleSave} disabled={!tempKey.trim()} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saved ? "Saved!" : "Save API Key"}
        </Button>
      </CardContent>
    </Card>
  )
}
