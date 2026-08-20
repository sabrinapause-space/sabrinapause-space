/**
 * NotionLoader - Implementation of ContentLoader interface
 * Fetches content from Notion API and transforms to internal schema
 */

import { Client } from '@notionhq/client';
import type { ContentLoader } from '../interfaces/content-loader';
import type { Content, NotionBlock } from '../types';
import { transformNotionPageToContent } from './transformers';
import { ImageCache } from './image-cache';

export class NotionLoader implements ContentLoader {
  private notion: Client;
  private databaseId: string;
  private imageCache?: ImageCache;
  private cacheImages: boolean;

  // Static memory cache for multi-session performance
  private static pageCache: any[] | null = null;
  private static contentCache: Map<string, Content> = new Map();

  constructor(apiKey: string, databaseId: string, options?: { cacheImages?: boolean }) {
    this.notion = new Client({ auth: apiKey });
    this.databaseId = databaseId;
    this.cacheImages = options?.cacheImages || false;

    if (this.cacheImages) {
      this.imageCache = new ImageCache();
    }
  }

  /**
   * Retry a Notion API call with exponential backoff.
   * Notion's SDK occasionally surfaces raw network/undici failures (dropped
   * connections, timeouts) as opaque low-level errors instead of clean
   * APIResponseErrors — retrying a couple of times avoids failing an entire
   * build over a single transient blip.
   */
  private async withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
      }
    }
    // Unreachable, but keeps TS happy
    throw new Error('withRetry: exhausted retries');
  }

  /**
   * Fetch all blocks for a page
   */
  private async fetchPageBlocks(pageId: string): Promise<NotionBlock[]> {
    const blocks: NotionBlock[] = [];
    let cursor: string | undefined = undefined;

    do {
      const response = await this.withRetry(() =>
        this.notion.blocks.children.list({
          block_id: pageId,
          start_cursor: cursor,
        })
      );

      blocks.push(...(response.results as NotionBlock[]));
      cursor = response.next_cursor || undefined;
    } while (cursor);

    return blocks;
  }

  /**
   * Fetch all pages from WEB_PUBLISH_VIEW (Status = "Ready for Web" OR "Published")
   */
  private async fetchAllPages(): Promise<any[]> {
    if (NotionLoader.pageCache) return NotionLoader.pageCache;

    const pages: any[] = [];
    let cursor: string | undefined = undefined;

    do {
      const response = await this.withRetry(() =>
        this.notion.databases.query({
          database_id: this.databaseId,
          filter: {
            or: [
              {
                property: 'Status',
                select: {
                  equals: 'Ready for Web',
                },
              },
              {
                property: 'Status',
                select: {
                  equals: 'Published',
                },
              },
            ],
          },
          start_cursor: cursor,
        })
      );

      pages.push(...response.results);
      cursor = response.next_cursor || undefined;
    } while (cursor);

    NotionLoader.pageCache = pages;
    return pages;
  }

  /**
   * Transform a Notion page to Content
   */
  private async transformPage(page: any): Promise<Content> {
    const cacheKey = `${page.id}-${page.last_edited_time}`;
    if (NotionLoader.contentCache.has(cacheKey)) {
      return NotionLoader.contentCache.get(cacheKey)!;
    }

    const blocks = await this.fetchPageBlocks(page.id);
    let content = transformNotionPageToContent(page, blocks);

    // Cache images if enabled
    if (this.cacheImages && this.imageCache) {
      // 1. Hero Image
      if (content.heroImage) {
        const result = await this.imageCache.cacheImage(content.heroImage, page.id);
        if (result) {
          content.heroImage = result.url;
          if (result.width && result.height) {
            (content as any).heroImageWidth = result.width;
            (content as any).heroImageHeight = result.height;
          }
        } else {
          // Cache failed (expired Notion URL, network error) — remove to avoid broken images
          content.heroImage = undefined;
          (content as any).heroImageWidth = undefined;
          (content as any).heroImageHeight = undefined;
        }
      }

      // 2. Podcast audio files
      if (content.contentType === 'podcast' && 'audioFiles' in content) {
        const podcast = content as any;
        for (let i = 0; i < podcast.audioFiles.length; i++) {
          const file = podcast.audioFiles[i];
          const stableId = `${page.id}-audio-${i}`;
          const result = await this.imageCache.cacheImage(file.url, stableId);
          if (result) file.url = result.url;
        }
      }

      // 3. Comic panels
      if (content.contentType === 'comic' && 'panels' in content) {
        const comic = content as any;
        for (let i = 0; i < comic.panels.length; i++) {
          const panel = comic.panels[i];
          const stableId = `${page.id}-panel-${panel.panelNumber || i}`;
          const result = await this.imageCache.cacheImage(panel.imageUrl, stableId);
          if (result) {
            panel.imageUrl = result.url;
            if (result.width && result.height) {
              panel.width = result.width;
              panel.height = result.height;
            }
          }
        }
      }

      // 4. Blocks (Recursive)
      content.blocks = await this.imageCache.cacheBlockImages(content.blocks);
    }

    NotionLoader.contentCache.set(cacheKey, content);
    return content;
  }

  /**
   * Get all content, optionally filtered by content type
   */
  async getAll(contentType?: 'article' | 'comic' | 'podcast'): Promise<Content[]> {
    const pages = await this.fetchAllPages();

    // Transform all pages
    const contents = await Promise.all(
      pages.map(page => this.transformPage(page))
    );

    // Filter by content type if specified
    if (contentType) {
      return contents.filter(content => content.contentType === contentType);
    }

    return contents;
  }

  /**
   * Get a single content item by slug
   */
  async getBySlug(slug: string): Promise<Content | null> {
    const pages = await this.fetchAllPages();

    // Find page with matching slug
    const page = pages.find(p => {
      const slugProperty = p.properties.Slug;
      const pageSlug = slugProperty?.rich_text
        ?.map((item: any) => item.plain_text || '')
        .join('');
      return pageSlug === slug;
    });

    if (!page) return null;

    return this.transformPage(page);
  }

  /**
   * Get all content items within a specific project
   */
  async getByProject(projectSlug: string): Promise<Content[]> {
    const pages = await this.fetchAllPages();

    // Filter pages that have the project in their Project multi-select
    const matchingPages = pages.filter(p => {
      const projectProperty = p.properties.Project;
      if (!projectProperty?.multi_select) return false;

      const projects = projectProperty.multi_select.map((item: any) =>
        item.name.toLowerCase().replace(/\s+/g, '-')
      );

      return projects.includes(projectSlug.toLowerCase());
    });

    return Promise.all(matchingPages.map(page => this.transformPage(page)));
  }

  /**
   * Get content items by Notion page IDs (for Counterpoint relation)
   */
  async getByPageIds(pageIds: string[]): Promise<Content[]> {
    if (!pageIds?.length) return [];

    const pages = await this.fetchAllPages();
    const idSet = new Set(pageIds);
    const matchingPages = pages.filter(p => idSet.has(p.id));

    // Preserve order from counterpointIds
    const ordered = pageIds
      .map(id => matchingPages.find(p => p.id === id))
      .filter(Boolean);

    return Promise.all(ordered.map(page => this.transformPage(page)));
  }

  /**
   * Get all content items in a specific web category
   */
  async getByCategory(category: string): Promise<Content[]> {
    const pages = await this.fetchAllPages();

    // Filter pages with matching web category
    const matchingPages = pages.filter(p => {
      const categoryProperty = p.properties['Web Category'];
      const pageCategory = categoryProperty?.select?.name || '';
      return pageCategory.toLowerCase() === category.toLowerCase();
    });

    return Promise.all(matchingPages.map(page => this.transformPage(page)));
  }
}
