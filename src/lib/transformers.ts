/**
 * Data transformation utilities
 * Transform Notion pages to internal content schema
 */

import type { NotionPage, NotionBlock, BaseContent, ArticleContent, ComicContent, PodcastContent, Content } from '../types';

/**
 * Extract text from Notion rich text property
 */
function extractRichText(property: any): string {
  if (!property || !property.rich_text) return '';
  return property.rich_text
    .map((item: any) => item.plain_text || '')
    .join('');
}

/**
 * Extract title from Notion title property
 */
function extractTitle(property: any): string {
  if (!property) return '';
  // Handle both 'title' and 'name' property types
  const titleArray = property.title || property.name || [];
  return titleArray
    .map((item: any) => item.plain_text || '')
    .join('');
}

/**
 * Extract multi-select values
 */
function extractMultiSelect(property: any): string[] {
  if (!property || !property.multi_select) return [];
  return property.multi_select.map((item: any) => item.name);
}

/**
 * Extract select value
 */
function extractSelect(property: any): string {
  if (!property || !property.select) return '';
  return property.select.name || '';
}

/**
 * Extract date value
 */
function extractDate(property: any): string {
  if (!property || !property.date) return '';
  const date = property.date.start;
  // Return ISO 8601 format (YYYY-MM-DD)
  return date ? date.split('T')[0] : '';
}

/**
 * Extract number value
 */
function extractNumber(property: any): number {
  if (!property || property.number === null || property.number === undefined) return 0;
  return property.number;
}

/**
 * Extract file URL from files property
 */
function extractFileUrl(property: any): string | undefined {
  if (!property || !property.files || property.files.length === 0) return undefined;
  const file = property.files[0];
  if (file.type === 'external') return file.external.url;
  if (file.type === 'file') return file.file.url;
  return undefined;
}

/**
 * Transform Notion page to BaseContent
 */
export function transformToBaseContent(page: NotionPage, blocks: NotionBlock[]): BaseContent {
  const props = page.properties;
  
  // Extract required fields (handle both "Title" and "Name" properties)
  const title = extractTitle(props.Title || props.Name);
  const slug = extractRichText(props.Slug);
  const contentType = extractSelect(props['Content Type']) as 'article' | 'comic' | 'podcast';
  const date = extractDate(props.Date);
  const locationName = extractRichText(props.Location);
  const webCategory = extractSelect(props['Web Category']);
  const project = extractMultiSelect(props.Project);
  const concepts = extractMultiSelect(props.Concepts);
  const intentVector = extractRichText(props['Intent Vector']);
  const sdIndex = extractNumber(props['SD-Index™'] || props['SD-Index']);
  const heroImage = extractFileUrl(props['Hero Image']);
  
  // Infer language (default to 'en' for now, can be enhanced)
  const language: 'zh' | 'en' = 'en';
  
  return {
    id: page.id,
    contentType,
    title,
    date,
    slug,
    location: {
      name: locationName,
    },
    webCategory,
    project,
    concepts,
    intentVector,
    sdIndex,
    heroImage,
    blocks,
    // AGI-First Metadata (v2.1) - Reserved for future enhancement
    dialogue: undefined,
    philosophical_insight: undefined,
    emotion_trajectory: undefined,
    embedding: null,
    // Metadata
    schema_version: '1.0',
    last_updated: new Date().toISOString(),
    language,
  };
}

/**
 * Transform to ArticleContent
 */
export function transformToArticleContent(base: BaseContent, blocks: NotionBlock[]): ArticleContent {
  // Extract excerpt from first paragraph block
  let excerpt = '';
  const firstParagraph = blocks.find(b => b.type === 'paragraph');
  if (firstParagraph && firstParagraph.paragraph) {
    const text = firstParagraph.paragraph.rich_text
      ?.map((item: any) => item.plain_text || '')
      .join('') || '';
    excerpt = text.substring(0, 200);
  }
  
  // Calculate reading time (average 200 words per minute)
  const wordCount = blocks
    .filter(b => b.type === 'paragraph')
    .reduce((count, block) => {
      const text = block.paragraph?.rich_text
        ?.map((item: any) => item.plain_text || '')
        .join('') || '';
      return count + text.split(/\s+/).length;
    }, 0);
  const readingTime = Math.ceil(wordCount / 200);
  
  return {
    ...base,
    contentType: 'article',
    excerpt,
    readingTime,
  };
}

/**
 * Transform to ComicContent
 */
export function transformToComicContent(base: BaseContent, blocks: NotionBlock[]): ComicContent {
  // Extract panels from image blocks
  const panels: ComicContent['panels'] = [];
  let panelNumber = 1;
  
  blocks.forEach((block, index) => {
    if (block.type === 'image') {
      const imageUrl = block.image?.file?.url || block.image?.external?.url || '';
      const caption = block.image?.caption
        ?.map((item: any) => item.plain_text || '')
        .join('') || '';
      
      // Get narration from next paragraph block
      let narration: string | undefined;
      if (index < blocks.length - 1 && blocks[index + 1].type === 'paragraph') {
        narration = blocks[index + 1].paragraph?.rich_text
          ?.map((item: any) => item.plain_text || '')
          .join('');
      }
      
      panels.push({
        panelNumber: panelNumber++,
        imageUrl,
        width: 800,
        height: 600, // Default, should be extracted from image metadata if available
        altText: caption,
        narration,
      });
    }
  });
  
  // Extract episode number from slug or title (fallback to 1)
  const episodeNumber = 1; // TODO: Extract from Notion property if available
  
  // Extract sensory memory from callout blocks
  let sensoryMemory: ComicContent['sensoryMemory'] | undefined;
  const calloutBlocks = blocks.filter(b => b.type === 'callout');
  // TODO: Parse callout structure to extract sensory memory
  
  return {
    ...base,
    contentType: 'comic',
    episodeNumber,
    panels,
    sensoryMemory,
  };
}

/**
 * Transform to PodcastContent
 */
export function transformToPodcastContent(base: BaseContent, blocks: NotionBlock[]): PodcastContent {
  // Extract audio file from file blocks
  let audioFile: PodcastContent['audioFile'] = {
    url: '',
    duration: '0:00',
  };
  
  const fileBlock = blocks.find(b => b.type === 'file' || b.type === 'video');
  if (fileBlock) {
    const url = fileBlock.file?.file?.url || fileBlock.video?.file?.url || '';
    audioFile = {
      url,
      duration: '0:00', // TODO: Extract duration from Notion if available
    };
  }
  
  // Extract transcript from all text blocks
  const transcript = blocks
    .filter(b => ['paragraph', 'heading_1', 'heading_2', 'heading_3'].includes(b.type))
    .map(block => {
      if (block.type.startsWith('heading_')) {
        const level = block.type.split('_')[1];
        const text = block[`heading_${level}`]?.rich_text
          ?.map((item: any) => item.plain_text || '')
          .join('') || '';
        return `\n## ${text}\n`;
      }
      return block.paragraph?.rich_text
        ?.map((item: any) => item.plain_text || '')
        .join('') || '';
    })
    .join('\n');
  
  // Extract structure from headings (simplified)
  const structure: PodcastContent['structure'] = {
    intro: { timestamp: '0:00', summary: '' },
    mainContent: { timestamp: '0:00', topics: [] },
    outro: { timestamp: '0:00', summary: '' },
  };
  
  return {
    ...base,
    contentType: 'podcast',
    audioFile,
    structure,
    transcript,
  };
}

/**
 * Main transformation function - transforms Notion page to Content
 */
export function transformNotionPageToContent(page: NotionPage, blocks: NotionBlock[]): Content {
  const base = transformToBaseContent(page, blocks);
  
  switch (base.contentType) {
    case 'article':
      return transformToArticleContent(base, blocks);
    case 'comic':
      return transformToComicContent(base, blocks);
    case 'podcast':
      return transformToPodcastContent(base, blocks);
    default:
      // Fallback to article if content type is unknown
      return transformToArticleContent(base, blocks);
  }
}
