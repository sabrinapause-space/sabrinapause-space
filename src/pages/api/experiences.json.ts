/**
 * API Endpoint: GET /api/experiences.json
 * Returns all published content from Notion
 */

import type { APIRoute } from 'astro';
import { NotionLoader } from '../../lib/notion-loader';

export const GET: APIRoute = async () => {
  try {
    const loader = new NotionLoader(
      import.meta.env.NOTION_API_KEY,
      import.meta.env.NOTION_DATABASE_ID
    );

    // Fetch all content
    const content = await loader.getAll();

    // Return JSON response
    return new Response(JSON.stringify({
      success: true,
      count: content.length,
      schema_version: '1.0',
      generated_at: new Date().toISOString(),
      data: content
    }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
