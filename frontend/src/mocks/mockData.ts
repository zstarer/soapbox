// frontend/src/mocks/mockData.ts
import { GrokData } from '@/types/shared';

export const mockCurrentEvents: GrokData = {
  content: "Tensions rise in the South China Sea as naval exercises intensify. U.S. Treasury yields climb amid inflation concerns. Trump announces new policy advisory team including Vance.",
  tags: ["international", "finance", "trump", "vance", "domestic"],
  sentiment: -0.3,
  relationships: {
    trump: { linkedEntity: "vance", type: "alliance" },
    usa: { linkedEntity: "china", type: "conflict" }
  },
  temporalLayer: "current",
  provenance: { source: "web_search", credibility: 0.92 },
  interactionState: "streaming",
  generatedAt: "2025-12-28T14:30:00Z"
};

export const mockCalendar: GrokData = {
  content: "Upcoming geopolitical calendar highlights.",
  tags: ["international", "finance", "trump"],
  sentiment: 0.0,
  relationships: {},
  temporalLayer: "current",
  provenance: { source: "web_search", credibility: 0.90 },
  interactionState: "interactive",
  generatedAt: "2025-12-28T15:00:00Z",
  events: [
    {
      date: "2025-12-30",
      title: "Federal Reserve Interest Rate Decision",
      summary: "FOMC announcement expected to signal rate path for 2026.",
      impact: "high",
      tags: ["finance", "domestic"]
    },
    {
      date: "2026-01-05",
      title: "BRICS Summit Preparatory Meeting",
      summary: "Discussions on expanded membership and alternative payment systems.",
      impact: "medium",
      tags: ["international", "finance"]
    },
    {
      date: "2026-01-15",
      title: "Inauguration Day (U.S.)",
      summary: "Swearing-in of new administration officials.",
      impact: "high",
      tags: ["domestic", "trump"]
    }
  ]
};

export const mockDataArray: GrokData[] = [
  mockCurrentEvents,
  mockCalendar
];

