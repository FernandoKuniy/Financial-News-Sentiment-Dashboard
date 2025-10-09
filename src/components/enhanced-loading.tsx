"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Loader2, 
  TrendingUp, 
  Newspaper, 
  Brain, 
  BarChart3, 
  CheckCircle2,
  Clock
} from "lucide-react";

interface LoadingStage {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}

const loadingStages: LoadingStage[] = [
  {
    id: "price",
    icon: TrendingUp,
    title: "Fetching Price Data",
    description: "Getting latest stock price information",
    color: "text-blue-600"
  },
  {
    id: "news",
    icon: Newspaper,
    title: "Gathering News",
    description: "Collecting recent headlines and articles",
    color: "text-green-600"
  },
  {
    id: "sentiment",
    icon: Brain,
    title: "AI Sentiment Analysis",
    description: "Analyzing sentiment with machine learning",
    color: "text-purple-600"
  },
  {
    id: "trends",
    icon: BarChart3,
    title: "Computing Trends",
    description: "Calculating sentiment patterns and correlations",
    color: "text-orange-600"
  }
];

interface EnhancedLoadingProps {
  query?: string;
}

export function EnhancedLoading({ query }: EnhancedLoadingProps) {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate stage progression
    const stageInterval = setInterval(() => {
      setActiveStageIndex((prev) => {
        const next = prev + 1;
        if (next >= loadingStages.length) {
          return prev; // Stay on last stage
        }
        return next;
      });
    }, 3000);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) return prev; // Don't complete until actually done
        return prev + Math.random() * 8;
      });
    }, 400);

    return () => {
      clearInterval(stageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const currentStageData = loadingStages[activeStageIndex];
  const CurrentIcon = currentStageData?.icon || Loader2;

  return (
    <div aria-live="polite" className="space-y-6">
      {/* Main Loading Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
            <CurrentIcon className={`h-6 w-6 ${currentStageData?.color || 'text-blue-600'} mr-2`} />
            <span className="text-lg font-medium text-slate-100">
              {currentStageData?.title || "Analyzing..."}
            </span>
          </div>
          
          {query && (
            <p className="text-sm text-slate-300 mb-2">
              Analyzing sentiment for <span className="font-semibold text-slate-100">&ldquo;{query}&rdquo;</span>
            </p>
          )}
          
          <p className="text-sm text-slate-400 mb-4">
            {currentStageData?.description || "Processing your request..."}
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-700 rounded-full h-3 mb-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-3 rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${Math.min(progress, 85)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
            </div>
          </div>
          
          {/* Helpful Tip */}
          <div className="mt-4 p-3 bg-slate-800 border border-slate-700 rounded-lg">
            <p className="text-xs text-slate-300">
              <strong>💡 Tip:</strong> Our AI analyzes thousands of news articles to provide accurate sentiment insights. 
              The more recent news available, the more comprehensive your analysis will be.
            </p>
          </div>
        </div>

        {/* Stage Progress */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Analysis Progress</h3>
          {loadingStages.map((stage, index) => {
            const StageIcon = stage.icon;
            const isActive = index === activeStageIndex;
            const isCompleted = index < activeStageIndex;
            
            return (
              <div 
                key={stage.id}
                className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
                  isActive ? 'bg-slate-800 border border-slate-700' : 
                  isCompleted ? 'bg-slate-800 border border-green-600' :
                  'bg-slate-800 border border-slate-700'
                }`}
              >
                <div className="flex-shrink-0 mr-3">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : isActive ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center">
                    <StageIcon className={`h-4 w-4 mr-2 ${stage.color}`} />
                    <span className={`text-sm font-medium ${
                      isActive ? 'text-blue-400' : 
                      isCompleted ? 'text-green-400' : 
                      'text-slate-300'
                    }`}>
                      {stage.title}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${
                    isActive ? 'text-blue-300' : 
                    isCompleted ? 'text-green-300' : 
                    'text-slate-400'
                  }`}>
                    {stage.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skeleton Content Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {[0,1,2,3].map((i) => (
          <div key={i} className="p-4 rounded-2xl border border-slate-800 bg-slate-900">
            <Skeleton className="h-4 w-24 mb-3 bg-slate-700" />
            <Skeleton className="h-8 w-20 bg-slate-700" />
          </div>
        ))}
      </div>
      
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-4">
          <Skeleton className="h-6 w-32 mb-2 bg-slate-700" />
          <Skeleton className="h-4 w-48 bg-slate-700" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="py-3 border-b border-slate-800 last:border-b-0">
            <Skeleton className="h-4 w-3/4 mb-2 bg-slate-700" />
            <Skeleton className="h-3 w-40 bg-slate-700" />
          </div>
        ))}
      </div>
    </div>
  );
}
