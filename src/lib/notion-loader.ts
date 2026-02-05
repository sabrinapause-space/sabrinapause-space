/**
 * NotionLoader - Implementation of ContentLoader interface
 * Fetches content from Notion API and transforms to internal schema
 */

import { Client } from '@notionhq/client';
import type { ContentLoader } from '../interfaces/content-loader';
import type { Content, NotionBlock } from '../types';
import { transformNotionPageToContent } from './transformers';

export class NotionLoader implements ContentLoader {
  private notion: Client;
  private databaseId: string;

  constructor(apiKey: string, databaseId: string) {
    this.notion = new Client({ auth: apiKey });
    this.databaseId = databaseId;
  }

  /**
   * Fetch all blocks for a page
   */
  private async fetchPageBlocks(pageId: string): Promise<NotionBlock[]> {
    const blocks: NotionBlock[] = [];
    let cursor: string | undefined = undefined;

    do {
      const response = await this.notion.blocks.children.list({
        block_id: pageId,
        start_cursor: cursor,
      });

      blocks.push(...(response.results as NotionBlock[]));
      cursor = response.next_cursor || undefined;
    } while (cursor);

    return blocks;
  }

  /**
   * Fetch all pages from WEB_PUBLISH_VIEW (Status = "Ready for Web" OR "Published")
   */
  private async fetchAllPages(): Promise<any[]> {
    const pages: any[] = [];
    let cursor: string | undefined = undefined;

    do {
      const response = await this.notion.databases.query({
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
      });

      pages.push(...response.results);
      cursor = response.next_cursor || undefined;
    } while (cursor);

    return pages;
  }

  /**
   * Transform a Notion page to Content
   */
  private async transformPage(page: any): Promise<Content> {
    const blocks = await this.fetchPageBlocks(page.id);
    return transformNotionPageToContent(page, blocks);
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
