/**
* Auto-Publish Status Script
* 
* After content is published to the site, automatically updates
* Notion page status from "Ready for Web" to "Published"
*/

import { config } from 'dotenv';
import { Client } from '@notionhq/client';

config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID!;

async function updateStatusToPublished() {
  console.log('🔄 Auto-updating page statuses...\n');

  try {
    // 1. Find all pages with Status = "Ready for Web"
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Status',
        select: {
          equals: 'Ready for Web',
        },
      },
    });

    console.log(`📄 Found ${response.results.length} pages with "Ready for Web" status\n`);

    // 2. Update each page to "Published"
    for (const page of response.results) {
      // Type guard for PageObjectResponse
      if (!('properties' in page)) continue;

      const pageId = page.id;
      const props = page.properties as any;

      const title = props.Title?.title?.[0]?.plain_text ||
        props.Name?.title?.[0]?.plain_text ||
        'Untitled';

      console.log(`   ✅ Updating: "${title}"`);

      await notion.pages.update({
        page_id: pageId,
        properties: {
          Status: {
            select: {
              name: 'Published',
            },
          },
        },
      });
    }

    console.log(`\n✨ Successfully updated ${response.results.length} pages to "Published"!\n`);

  } catch (error) {
    console.error('⚠️ Warning: Could not update Notion statuses:', (error as any).message);
    console.log('   (This is non-critical and won\'t fail the build)\n');
  }
}

// Run the script
updateStatusToPublished();
