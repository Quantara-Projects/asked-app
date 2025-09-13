"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Send, Bot, User, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  apiKey: string
}

export function ChatInterface({ apiKey }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [pendingAssistantId, setPendingAssistantId] = useState<string | null>(null)
  const [genStart, setGenStart] = useState<number | null>(null)
  const [elapsedMs, setElapsedMs] = useState<number>(0)
  const [lastAssistantId, setLastAssistantId] = useState<string | null>(null)
  const [lastDurationMs, setLastDurationMs] = useState<number | null>(null)
  const intervalRef = useRef<number | null>(null)

  const canSend = useMemo(() => input.trim().length > 0 && !!apiKey.trim() && !isLoading, [input, apiKey, isLoading])

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "[data-slot=scroll-area-viewport]",
      ) as HTMLDivElement | null
      if (viewport) viewport.scrollTop = viewport.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isLoading && genStart != null) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - genStart)
      }, 100)
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isLoading, genStart])

  async function sendMessage() {
    if (!canSend) return

    const userMessage: Message = {
      id: `${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    const assistantMessage: Message = {
      id: `${Date.now()}-assistant`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }

    setLastAssistantId(assistantMessage.id)
    setPendingAssistantId(assistantMessage.id)
    setGenStart(Date.now())
    setElapsedMs(0)
    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : '',
          "X-Title": "AI Chat Assistant",
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1-0528:free",
          stream: true,
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage.content },
          ],
        }),
      })

      if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`)

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let done = false
      let buffer = ""

      while (!done) {
        const chunk = await reader?.read()
        if (!chunk) break
        done = chunk.done
        buffer += decoder.decode(chunk.value || new Uint8Array(), { stream: true })

        const lines = buffer.split(/\n/)
        buffer = lines.pop() || ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith("data:")) continue
          const dataStr = trimmed.replace(/^data:\s?/, "").trim()
          if (!dataStr || dataStr === "[DONE]") continue
          try {
            const json = JSON.parse(dataStr)
            const delta: string = json?.choices?.[0]?.delta?.content ?? json?.choices?.[0]?.message?.content ?? ""
            if (delta) {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: m.content + delta } : m)),
              )
            }
          } catch {}
        }
        scrollToBottom()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setMessages((prev) => prev.filter((m) => m.id !== assistantMessage.id))
      setPendingAssistantId(null)
    } finally {
      setIsLoading(false)
      setPendingAssistantId(null)
      if (genStart != null) setLastDurationMs(Date.now() - genStart)
      setGenStart(null)
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!apiKey.trim()) {
    return (
      <Card className="chat-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please configure your OpenRouter API key above to start chatting.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="chat-card h-[70vh] sm:h-[75vh] md:h-[78vh] flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat with AI
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 pt-4">
        <div className="flex-1 pr-4" ref={scrollAreaRef}>
          <ScrollArea className="h-full">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-10 animate-in fade-in slide-in-from-top-2">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-70" />
                <p>Start a conversation with the AI assistant!</p>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-row ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="avatar">
                    <div className="avatar-inner">
                      <Bot className="h-4 w-4 text-secondary-foreground" />
                    </div>
                  </div>
                )}
                <div
                  className={`message-bubble ${
                    message.role === "user" ? "user-bubble" : "assistant-bubble"
                  } message-enter`}
                >
                  {message.id === pendingAssistantId && isLoading && message.content.length === 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="response-spinner text-sky-500" aria-label="Generating" />
                      <p className="timestamp">{message.timestamp.toLocaleTimeString()}</p>
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      <p className="timestamp">{message.timestamp.toLocaleTimeString()}</p>
                    </>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="avatar">
                    <div className="avatar-inner user">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          </ScrollArea>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="composer">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!canSend} size="icon" aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="hint">Press Enter to send • Shift + Enter for a new line</p>
      </CardContent>
    </Card>
  )
}
