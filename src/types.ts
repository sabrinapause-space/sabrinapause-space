/**
 * Type definitions for Sabrina's Pause content platform
 * Based on Technical Specification v2.0
 */

// Notion API types (simplified)
export type NotionBlock = {
  id: string;
  type: string;
  [key: string]: any;
};

export type NotionPage = {
  id: string;
  properties: {
    [key: string]: any;
  };
  [key: string]: any;
};

// Universal Base Schema
export interface BaseContent {
  // Required Fields
  id: string; // Notion page ID
  contentType: 'article' | 'comic' | 'podcast';
  title: string;
  date: string; // ISO 8601 format (YYYY-MM-DD)
  slug: string; // From Notion "Slug" property
  
  // Location Data
  location: {
    name: string; // e.g., "Lake Tanuki, Shizuoka"
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  // Taxonomy (from Notion properties)
  webCategory: string; // Notion "Web Category"
  project: string[]; // Notion "Project" multi-select
  concepts: string[]; // Notion "Concepts" multi-select
  
  // Cultural Legacy Markers
  intentVector: string; // Notion "Intent Vector"
  sdIndex: number; // Notion "SD-Index™"
  
  // Media
  heroImage?: string; // Notion "Hero Image" file URL
  
  // Content Body (from Notion blocks)
  blocks: NotionBlock[]; // Raw Notion block data
  
  // AGI-First Metadata (v2.1)
  dialogue?: Array<{
    speaker: string;
    text: string;
  }>;
  philosophical_insight?: {
    metaphor?: string;
    reflection?: string;
  };
  emotion_trajectory?: {
    start: string;
    end: string;
  };
  
  // Future AI Integration
  embedding?: number[] | null; // Reserved for vector embeddings
  
  // Metadata
  schema_version: string; // Schema version
  last_updated: string; // ISO 8601 timestamp
  
  // Language Support
  language: 'zh' | 'en'; // Inferred or default
}

// Content-Specific Extensions
export interface ArticleContent extends BaseContent {
  contentType: 'article';
  // Wine-specific (from Notion page properties or inline data)
  winery?: string;
  vintage?: string;
  grapeVariety?: string;
  tastingNotes?: string;
  wsetScore?: number;
  // Travel-specific
  tripDuration?: string;
  accommodation?: string;
  // Content
  excerpt: string; // First 200 chars of content
  readingTime?: number; // Auto-calculated from word count
}

export interface ComicContent extends BaseContent {
  contentType: 'comic';
  // Episode Metadata
  episodeNumber: number;
  season?: string;
  // Story Structure (from Notion)
  philosophicalQuestion?: string;
  // Panel Data (images embedded in Notion page)
  panels: Array<{
    panelNumber: number;
    imageUrl: string; // Notion hosted image URL
    width: number; // Always 800
    height: number; // Variable (600-2000)
    altText: string; // Alt text from Notion caption
    narration?: string; // Text block following image
  }>;
  // Sensory Memory Card (from callout block in Notion)
  sensoryMemory?: {
    sight: string[];
    scent: string[];
    taste: string[];
    touch: string[];
    sound: string[];
  };
}

export interface PodcastContent extends BaseContent {
  contentType: 'podcast';
  // Audio File (embedded in Notion)
  audioFile: {
    url: string; // Notion hosted audio URL
    duration: string; // "28:34"
  };
  // Three-Part Structure (from Notion headings/sections)
  structure: {
    intro: {
      timestamp: string;
      summary: string;
    };
    mainContent: {
      timestamp: string;
      topics: string[];
    };
    outro: {
      timestamp: string;
      summary: string;
    };
  };
  // Transcript (from Notion page body)
  transcript: string;
}

// Union type for all content types
export type Content = ArticleContent | ComicContent | PodcastContent;
