/**
 * Image Caching System
 * Downloads Notion images during build and replaces temporary S3 URLs with permanent local paths
 * 
 * Problem: Notion API image URLs expire after ~1 hour
 * Solution: Download all images to /public/images/ and update URLs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ImageCache {
  private cacheDir: string;
  private publicDir: string;
  private imageMap: Map<string, string>; // originalUrl -> localPath

  constructor() {
    // Public directory for serving images
    this.publicDir = path.join(process.cwd(), 'public', 'images');
    this.cacheDir = this.publicDir;
    this.imageMap = new Map();

    // Ensure directory exists
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Generate a stable filename from URL or stableId
   */
  private generateFilename(url: string, stableId?: string): string {
    // Use stableId if provided, otherwise hash the URL
    const name = stableId || crypto.createHash('md5').update(url).digest('hex');

    // Extract extension from URL or default to .jpg
    let ext = '.jpg';
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const match = pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|m4a|mp3)$/i);
      if (match) {
        ext = match[0].toLowerCase();
      }
    } catch (e) {
      // Invalid URL, use default
    }

    return `${name}${ext}`;
  }

  /**
   * Download image/file from URL
   */
  private async downloadImage(url: string, filepath: string): Promise<boolean> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        console.error(`   ❌ Failed to download: ${url.substring(0, 40)}... (${response.status})`);
        return false;
      }

      const buffer = await response.arrayBuffer();
      fs.writeFileSync(filepath, Buffer.from(buffer));

      return true;
    } catch (error) {
      console.error(`   ❌ Error downloading ${url.substring(0, 40)}...:`, error);
      return false;
    }
  }

  /**
   * Cache a single image/file
   * Returns the local path (relative to /public)
   */
  async cacheImage(url: string, stableId?: string): Promise<string | null> {
    if (!url || url === '') return null;

    // Check if already cached in memory
    if (this.imageMap.has(url)) {
      return this.imageMap.get(url)!;
    }

    // Check if URL is already a local path
    if (url.startsWith('/images/')) {
      return url;
    }

    const filename = this.generateFilename(url, stableId);
    const filepath = path.join(this.cacheDir, filename);
    const publicPath = `/images/${filename}`;

    // Check if file already exists on disk
    if (fs.existsSync(filepath)) {
      this.imageMap.set(url, publicPath);
      return publicPath;
    }

    // Download image
    console.log(`   ⬇️  Syncing: ${filename}`);
    const success = await this.downloadImage(url, filepath);

    if (success) {
      this.imageMap.set(url, publicPath);
      return publicPath;
    }

    return null;
  }

  /**
   * Cache hero image and return updated URL
   */
  async cacheHeroImage(url: string | undefined): Promise<string | undefined> {
    if (!url) return undefined;
    const cachedUrl = await this.cacheImage(url);
    return cachedUrl || undefined;
  }

  /**
   * Cache all images in Notion blocks and update URLs
   */
  async cacheBlockImages(blocks: any[]): Promise<any[]> {
    const updatedBlocks = [];

    for (const block of blocks) {
      const updatedBlock = { ...block };

      // Handle media blocks (image, audio, video, file)
      const mediaTypes = ['image', 'audio', 'video', 'file'];
      if (mediaTypes.includes(block.type)) {
        const media = block[block.type];
        const url = media?.file?.url || media?.external?.url;

        if (url) {
          const cachedUrl = await this.cacheImage(url, block.id);
          if (cachedUrl) {
            updatedBlock[block.type] = {
              ...media,
              type: 'file',
              file: { url: cachedUrl }
            };
          }
        }
      }

      // Handle nested blocks (recursively)
      if (block.has_children && block[block.type]?.children) {
        updatedBlock[block.type] = {
          ...block[block.type],
          children: await this.cacheBlockImages(block[block.type].children)
        };
      }

      updatedBlocks.push(updatedBlock);
    }

    return updatedBlocks;
  }

  /**
   * Get statistics
   */
  getStats(): { total: number; cached: number } {
    return {
      total: this.imageMap.size,
      cached: this.imageMap.size,
    };
  }
}
