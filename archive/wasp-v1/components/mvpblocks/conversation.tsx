'use client';

import React, { useState } from 'react';
import { Bot, Copy, CornerRightUp, Sparkles } from 'lucide-react';
import { Textarea } from '../../src/components/ui/textarea';
import { cn } from '../../src/lib/utils';
import { Button } from '../../src/components/ui/button';

export default function Conversation() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = { 
        role: 'assistant' as const, 
        content: 'This is a simulated AI response. In a real implementation, this would connect to an AI service.' 
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex gap-3 p-4 rounded-lg",
              message.role === 'user' 
                ? "bg-primary/10 ml-12" 
                : "bg-muted mr-12"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow">
              {message.role === 'user' ? '👤' : <Bot className="h-4 w-4" />}
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 p-4 rounded-lg bg-muted mr-12">
            <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0.1s' }}></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[44px] max-h-[200px] resize-none"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <CornerRightUp className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
 