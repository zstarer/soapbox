// shared/types.ts
export interface GrokData {
  id?: string;
  content: string;
  tags: string[];
  sentiment: number; // -1.0 to +1.0
  relationships: Record<string, { linkedEntity: string; type: 'alliance' | 'conflict' | 'economic' | 'support' | 'opposition' }>;
  temporalLayer: 'historical' | 'current' | 'predictive';
  provenance: { source: string; credibility: number };
  interactionState: 'static' | 'streaming' | 'interactive';
  generatedAt: string; // ISO timestamp
  events?: Array<{
    date: string; // YYYY-MM-DD
    title: string;
    summary: string;
    impact: 'low' | 'medium' | 'high';
    tags: string[];
  }>;
}

