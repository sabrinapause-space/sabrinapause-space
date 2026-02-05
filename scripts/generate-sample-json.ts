/**
 * Generate sample JSON output
 * Shows SD-Index and Intent Vector structure
 */

import { NotionLoader } from '../src/lib/notion-loader';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function generateSampleJSON() {
  try {
    console.log('📊 Generating sample JSON output...\n');

    // Initialize Notion loader
    const loader = new NotionLoader(
      process.env.NOTION_API_KEY!,
      process.env.NOTION_DATABASE_ID!
    );

    // Fetch first content item
    const content = await loader.getAll();
    
    if (content.length === 0) {
      console.log('⚠️  No content found with Status = "Ready for Web"');
      return;
    }

    const sampleContent = content[0];

    // Create sample JSON with key fields highlighted
    const sample = {
      success: true,
      schema_version: '1.0',
      generated_at: new Date().toISOString(),
      data: {
        // Core identification
        id: sampleContent.id,
        slug: sampleContent.slug,
        title: sampleContent.title,
        contentType: sampleContent.contentType,
        
        // Temporal and spatial context
        date: sampleContent.date,
        location: sampleContent.location,
        
        // Cultural Legacy Markers (AGI-First)
        intentVector: sampleContent.intentVector,
        sdIndex: sampleContent.sdIndex,
        
        // Taxonomy
        webCategory: sampleContent.webCategory,
        project: sampleContent.project,
        concepts: sampleContent.concepts,
        
        // AGI-First Metadata (v2.1)
        dialogue: sampleContent.dialogue || [],
        philosophical_insight: sampleContent.philosophical_insight || {},
        emotion_trajectory: sampleContent.emotion_trajectory || {},
        
        // Media
        heroImage: sampleContent.heroImage,
        
        // Content (truncated for sample)
        blocks: `[${sampleContent.blocks.length} blocks]`,
        
        // AI Integration (reserved)
        embedding: sampleContent.embedding,
        
        // Metadata
        schema_version: sampleContent.schema_version,
        last_updated: sampleContent.last_updated,
        language: sampleContent.language
      }
    };

    console.log('📄 Sample JSON Output:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(sample, null, 2));
    console.log('='.repeat(60));
    console.log('\n✅ Sample JSON generation complete!');
    console.log('\n💡 Key AGI-First Fields:');
    console.log(`   Intent Vector: "${sampleContent.intentVector}"`);
    console.log(`   SD-Index™: ${sampleContent.sdIndex}/10`);
    console.log(`   Schema Version: ${sampleContent.schema_version}`);

  } catch (error) {
    console.error('\n❌ Sample generation failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run sample generator
generateSampleJSON();
