/**
 * GitHub Backup System
 * Saves all Notion content as JSON files for data independence
 */

import fs from 'fs';
import path from 'path';
import type { Content } from '../types';

export class BackupSystem {
  private backupDir: string;

  constructor(baseDir: string = 'data/backup') {
    // Create backup directory with today's date
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    this.backupDir = path.join(process.cwd(), baseDir, today);
  }

  /**
   * Ensure backup directory exists
   */
  private ensureDirectory(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`✅ Created backup directory: ${this.backupDir}`);
    }
  }

  /**
   * Save all content to JSON file
   */
  async saveAllContent(content: Content[]): Promise<string> {
    this.ensureDirectory();

    const filename = 'all-experiences.json';
    const filepath = path.join(this.backupDir, filename);

    const backup = {
      version: '1.0',
      backup_date: new Date().toISOString(),
      count: content.length,
      data: content
    };

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf-8');
    console.log(`✅ Saved ${content.length} items to ${filepath}`);

    return filepath;
  }

  /**
   * Save individual content files (organized by content type)
   */
  async saveIndividualContent(content: Content[]): Promise<string[]> {
    this.ensureDirectory();

    const filepaths: string[] = [];
    const slugCounts: Record<string, number> = {};

    // Group content by type
    const byType = {
      article: content.filter(c => c.contentType === 'article'),
      comic: content.filter(c => c.contentType === 'comic'),
      podcast: content.filter(c => c.contentType === 'podcast'),
    };

    // Save each type in its own folder
    for (const [type, items] of Object.entries(byType)) {
      if (items.length === 0) continue;
      
      const typeDir = path.join(this.backupDir, `${type}s`);
      if (!fs.existsSync(typeDir)) {
        fs.mkdirSync(typeDir, { recursive: true });
      }

      for (const item of items) {
        let filename = `${item.slug}.json`;
        
        // Handle duplicate slugs
        const slugKey = `${type}:${item.slug}`;
        if (slugCounts[slugKey]) {
          slugCounts[slugKey]++;
          filename = `${item.slug}-${slugCounts[slugKey]}.json`;
        } else {
          slugCounts[slugKey] = 1;
        }
        
        const filepath = path.join(typeDir, filename);

        const backup = {
          version: '1.0',
          backup_date: new Date().toISOString(),
          data: item
        };

        fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf-8');
        filepaths.push(filepath);
      }
      
      console.log(`✅ Saved ${items.length} ${type}(s) to ${type}s/`);
    }
    
    // Warn about duplicates
    const duplicates = Object.entries(slugCounts).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log(`⚠️  Warning: Found duplicate slugs:`);
      duplicates.forEach(([slug, count]) => {
        console.log(`   - "${slug}" appears ${count} times`);
      });
    }

    return filepaths;
  }

  /**
   * Save metadata summary (Enhanced for AGI)
   */
  async saveMetadata(content: Content[]): Promise<string> {
    this.ensureDirectory();

    const metadata = {
      // Backup Information
      schema_version: '1.0',
      backup_date: new Date().toISOString(),
      backup_source: 'Notion API',
      
      // Content Statistics
      total_count: content.length,
      content_types: {
        article: content.filter(c => c.contentType === 'article').length,
        comic: content.filter(c => c.contentType === 'comic').length,
        podcast: content.filter(c => c.contentType === 'podcast').length
      },
      
      // Taxonomy
      categories: [...new Set(content.map(c => c.webCategory))],
      projects: [...new Set(content.flatMap(c => c.project))],
      all_concepts: [...new Set(content.flatMap(c => c.concepts || []))],
      
      // Timeline
      date_range: {
        earliest: content.reduce((min, c) => c.date < min ? c.date : min, content[0]?.date || ''),
        latest: content.reduce((max, c) => c.date > max ? c.date : max, content[0]?.date || '')
      },
      
      // Content Index (for quick lookup)
      content_index: content.map(c => ({
        slug: c.slug,
        title: c.title,
        type: c.contentType,
        date: c.date,
        sd_index: c.sdIndex
      })),
      
      // AGI Metadata
      agi_ready: {
        with_embeddings: content.filter(c => c.embedding !== null).length,
        with_dialogue: content.filter(c => c.dialogue && c.dialogue.length > 0).length,
        with_philosophical_insight: content.filter(c => c.philosophical_insight && Object.keys(c.philosophical_insight).length > 0).length,
        total_blocks: content.reduce((sum, c) => sum + c.blocks.length, 0)
      }
    };

    const filepath = path.join(this.backupDir, 'metadata.json');
    fs.writeFileSync(filepath, JSON.stringify(metadata, null, 2), 'utf-8');
    console.log(`✅ Saved enhanced metadata to ${filepath}`);

    return filepath;
  }

  /**
   * Full backup - saves all, individual files, and metadata
   */
  async performFullBackup(content: Content[]): Promise<void> {
    console.log('\n🔄 Starting GitHub backup system...');
    console.log(`   Backing up ${content.length} items to ${this.backupDir}`);

    await this.saveAllContent(content);
    await this.saveIndividualContent(content);
    await this.saveMetadata(content);

    console.log('\n✅ Backup complete!');
    console.log(`   📂 Location: ${this.backupDir}`);
    console.log('   💡 Commit these files to GitHub for data independence');
  }
}
