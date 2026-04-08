import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Eye, EyeOff, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { FRAMEWORK_TAG_CONFIG } from "@/types/briefing";
import { haptics } from "@/lib/haptics";
import type { BriefingSegment, FrameworkTag } from "@/types/briefing";

interface SegmentCardProps {
  segment: BriefingSegment;
  index: number;
  isActive: boolean;
  onFeedback: (reaction: "useful" | "not_useful") => void;
  onWatchCompany?: (company: string) => void;
  watchedCompanies?: string[];
}

// Extract likely company names from headline + source
function extractCompanyNames(segment: BriefingSegment): string[] {
  const companies: string[] = [];

  // Known AI/tech company patterns
  const knownCompanies = [
    "OpenAI", "Anthropic", "Google", "Microsoft", "Meta", "Apple", "Amazon", "AWS",
    "Nvidia", "AMD", "Intel", "Cohere", "Mistral", "Perplexity", "Databricks",
    "Snowflake", "Palantir", "Salesforce", "HubSpot", "Stripe", "Vercel", "Supabase",
    "Notion", "Figma", "Canva", "Slack", "Zoom", "Atlassian", "Shopify",
    "Tesla", "SpaceX", "xAI", "DeepMind", "Stability AI", "Midjourney", "Runway",
    "Hugging Face", "Scale AI", "Anyscale", "Modal", "Replicate", "Together AI",
    "Groq", "Cerebras", "SambaNova", "Inflection", "Character AI", "Jasper",
    "Writer", "Copy.ai", "Otter", "BetterUp", "Ezra", "Gong", "Clari",
    "Bloomberg", "Reuters", "McKinsey", "Bain", "BCG", "Deloitte", "Accenture",
  ];

  const text = `${segment.headline} ${segment.analysis} ${segment.source}`;

  for (const company of knownCompanies) {
    if (text.includes(company)) {
      companies.push(company);
    }
  }

  return [...new Set(companies)];
}

export function SegmentCard({
  segment,
  index,
  isActive,
  onFeedback,
  onWatchCompany,
  watchedCompanies = [],
}: SegmentCardProps) {
  const [feedback, setFeedback] = useState<"useful" | "not_useful" | null>(null);
  const [justWatched, setJustWatched] = useState<string | null>(null);
  const tagConfig = FRAMEWORK_TAG_CONFIG[segment.framework_tag as FrameworkTag];

  const detectedCompanies = extractCompanyNames(segment);
  const unwatchedCompanies = detectedCompanies.filter(
    (c) => !watchedCompanies.includes(c.toLowerCase())
  );

  const handleFeedback = (reaction: "useful" | "not_useful") => {
    if (feedback) return;
    setFeedback(reaction);
    onFeedback(reaction);
    haptics.light();
  };

  const handleWatch = (company: string) => {
    onWatchCompany?.(company);
    setJustWatched(company);
    haptics.light();
    setTimeout(() => setJustWatched(null), 2000);
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        isActive && "border-l-2 border-l-accent shadow-sm"
      )}
    >
      <CardContent className="p-3 space-y-2">
        {/* Framework tag */}
        {tagConfig && (
          <Badge
            variant="outline"
            className={cn("text-[10px] font-medium border", tagConfig.className)}
          >
            {tagConfig.label}
          </Badge>
        )}

        {/* Headline */}
        <p className="text-sm font-semibold leading-snug">{segment.headline}</p>

        {/* Analysis */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {segment.analysis}
        </p>

        {/* Relevance reason */}
        {segment.relevance_reason && (
          <p className="text-[11px] text-accent/80 italic leading-relaxed">
            {segment.relevance_reason}
          </p>
        )}

        {/* Actions row */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto">
          {/* Feedback buttons */}
          <button
            onClick={() => handleFeedback("useful")}
            disabled={feedback !== null}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              feedback === "useful"
                ? "text-accent bg-accent/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFeedback("not_useful")}
            disabled={feedback !== null}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              feedback === "not_useful"
                ? "text-muted-foreground bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>

          {/* Watch company buttons */}
          {unwatchedCompanies.length > 0 && (
            <div className="flex items-center gap-1 ml-1">
              <div className="w-px h-3.5 bg-border" />
              {unwatchedCompanies.slice(0, 2).map((company) => (
                <button
                  key={company}
                  onClick={() => handleWatch(company)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all",
                    justWatched === company
                      ? "text-accent bg-accent/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {justWatched === company ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                  {justWatched === company ? `Watching ${company}` : company}
                </button>
              ))}
            </div>
          )}

          {/* Source */}
          {segment.source && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              {segment.source}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
