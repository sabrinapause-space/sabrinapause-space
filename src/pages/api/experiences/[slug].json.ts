/**
 * API Endpoint: GET /api/experiences/[slug].json
 * Returns a single content item by slug
 */

import type { APIRoute } from 'astro';
import { NotionLoader } from '../../../lib/notion-loader';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { slug } = params;

    if (!slug) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Slug parameter is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const loader = new NotionLoader(
      import.meta.env.NOTION_API_KEY,
      import.meta.env.NOTION_DATABASE_ID
    );

    // Fetch content by slug
    const content = await loader.getBySlug(slug);

    if (!content) {
      return new Response(JSON.stringify({
        success: false,
        error: `Content with slug "${slug}" not found`
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Return JSON response
    return new Response(JSON.stringify({
      success: true,
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

// Generate static paths for all slugs at build time
export async function getStaticPaths() {
  const loader = new NotionLoader(
    process.env.NOTION_API_KEY!,
    process.env.NOTION_DATABASE_ID!
  );

  const content = await loader.getAll();

  return content.map((item) => ({
    params: { slug: item.slug },
  }));
}
