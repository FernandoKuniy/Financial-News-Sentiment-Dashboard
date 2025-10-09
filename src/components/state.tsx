"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TriangleAlert, Loader2, TrendingUp, Newspaper, Brain, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";

const loadingMessages = [
  { icon: TrendingUp, text: "Fetching latest price data...", color: "text-blue-600" },
  { icon: Newspaper, text: "Gathering recent news headlines...", color: "text-green-600" },
  { icon: Brain, text: "Analyzing sentiment with AI...", color: "text-purple-600" },
  { icon: BarChart3, text: "Computing sentiment trends...", color: "text-orange-600" },
  { icon: TrendingUp, text: "Finalizing analysis...", color: "text-blue-600" },
];

export function LoadingState({ query }: { query?: string }) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // Don't go to 100% until actually loaded
        return prev + Math.random() * 15;
      });
    }, 500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const currentMessage = loadingMessages[currentMessageIndex];
  const IconComponent = currentMessage.icon;

  return (
    <div aria-live="polite" className="space-y-6">
      {/* Dynamic Loading Message */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          <IconComponent className={`h-6 w-6 ${currentMessage.color} mr-2`} />
          <span className="text-lg font-medium text-slate-100">
            {currentMessage.text}
          </span>
        </div>
        
        {query && (
          <p className="text-sm text-slate-300 mb-4">
            Analyzing sentiment for <span className="font-semibold text-slate-100">&ldquo;{query}&rdquo;</span>
          </p>
        )}
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress, 90)}%` }}
          />
        </div>
      </div>

      {/* Skeleton Content */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {[0,1,2,3].map((i) => (
          <div key={i} className="p-4 rounded-2xl border border-slate-800 bg-slate-900">
            <Skeleton className="h-4 w-24 mb-3 bg-slate-700" />
            <Skeleton className="h-8 w-20 bg-slate-700" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="py-3">
            <Skeleton className="h-4 w-3/4 mb-2 bg-slate-700" />
            <Skeleton className="h-3 w-40 bg-slate-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  query,
}: {
  message: string;
  onRetry: () => void;
  query?: string | null;
}) {
  return (
    <Alert variant="destructive" role="alert" className="rounded-2xl bg-red-900 border-red-800">
      <TriangleAlert className="h-4 w-4" />
      <AlertTitle className="text-red-200">Failed to load{query ? ` "${query}"` : ""}</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-3">
        <span className="text-sm text-red-300">{message}</span>
        <Button size="sm" onClick={onRetry} aria-label="Retry loading" className="bg-red-800 hover:bg-red-700 text-red-100">
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}
