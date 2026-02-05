/**
 * Generate backup script
 * Run this during build to save all Notion data to /data/backup/
 */

import { NotionLoader } from '../src/lib/notion-loader';
import { BackupSystem } from '../src/lib/backup-system';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function generateBackup() {
  try {
    console.log('🚀 Starting Notion backup generation...\n');

    // Initialize Notion loader
    const loader = new NotionLoader(
      process.env.NOTION_API_KEY!,
      process.env.NOTION_DATABASE_ID!
    );

    // Fetch all content
    console.log('📥 Fetching content from Notion...');
    const content = await loader.getAll();
    console.log(`✅ Fetched ${content.length} items\n`);

    // Initialize backup system
    const backup = new BackupSystem();

    // Perform full backup
    await backup.performFullBackup(content);

    console.log('\n✨ Backup generation complete!');
    
    // Auto-commit to GitHub
    console.log('\n📦 Committing backup to GitHub...');
    await autoCommitBackup();

  } catch (error) {
    console.error('\n❌ Backup generation failed:');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Auto-commit and push backup files to GitHub
 */
async function autoCommitBackup() {
  const { execSync } = await import('child_process');
  
  try {
    const date = new Date().toISOString().split('T')[0];
    
    // Add backup files
    console.log('   📁 Adding backup files to git...');
    execSync('git add data/backup/', { stdio: 'pipe' });
    
    // Commit with descriptive message
    const commitMessage = `[AUTO] Backup: Notion content snapshot ${date}`;
    console.log(`   💾 Committing: "${commitMessage}"`);
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'pipe' });
    
    // Push to GitHub
    console.log('   ⬆️  Pushing to GitHub...');
    execSync('git push', { stdio: 'inherit' });
    
    console.log('✅ Backup committed and pushed to GitHub!\n');
    
  } catch (error: any) {
    // If no changes to commit, that's okay
    if (error.message?.includes('nothing to commit')) {
      console.log('ℹ️  No new changes to commit\n');
    } else {
      console.error('⚠️  Git operation failed:', error.message);
      console.log('   💡 Tip: You may need to push manually with "git push"\n');
      // Don't fail the build, just warn
    }
  }
}

// Run backup
generateBackup();
