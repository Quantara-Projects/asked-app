"use client"

import { useEffect, useState } from "react"
import { ApiKeySettings } from "@/components/api-key-settings"
import { ChatInterface } from "@/components/chat-interface"
import { Bot, MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [apiKey, setApiKey] = useState<string>("")

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('openrouter_api_key') : null
    if (saved) setApiKey(saved)
  }, [])

  const handleApiKeyChange = (key: string) => {
    setApiKey(key)
    try { localStorage.setItem('openrouter_api_key', key) } catch {}
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex w-72 flex-col border-r bg-card/60 backdrop-blur-sm">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center shadow-sm">
                <Bot className="size-4" />
              </div>
              <div>
                <h1 className="text-base font-semibold leading-none">AI Chat Assistant</h1>
                <p className="text-xs text-muted-foreground">Education-inspired UI</p>
              </div>
            </div>
          </div>
          <div className="p-4 border-b">
            <Button className="w-full" variant="secondary">
              <MessageSquarePlus className="size-4" />
              New chat
            </Button>
          </div>
          <div className="p-4 overflow-auto grow">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Settings</div>
            <ApiKeySettings apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />
          </div>
        </aside>

        <main className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 border-b bg-gradient-to-r from-[color:var(--sidebar)] to-[color:var(--card)]/60 backdrop-blur-md">
            <div className="container mx-auto max-w-4xl px-4 py-4">
              <h2 className="text-xl font-semibold">Chat</h2>
              <p className="text-sm text-muted-foreground">Connect with AI using OpenRouter API. Configure your API key to get started.</p>
            </div>
          </header>

          <section className="container mx-auto max-w-4xl px-2 sm:px-4 py-4 grow flex">
            <div className="grow">
              <ChatInterface apiKey={apiKey} />
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
