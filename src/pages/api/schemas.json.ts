/**
 * API Endpoint: GET /api/schemas.json
 * Returns the schema definition for all content types
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const schemas = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    description: 'Sabrina\'s Pause - AGI-First Content Schema',
    content_types: {
      article: {
        type: 'article',
        description: 'Long-form written content',
        fields: {
          // Base fields
          id: { type: 'string', required: true, description: 'Notion page ID' },
          contentType: { type: 'string', required: true, enum: ['article', 'comic', 'podcast'] },
          title: { type: 'string', required: true },
          date: { type: 'string', required: true, format: 'ISO-8601' },
          slug: { type: 'string', required: true, description: 'URL-safe identifier' },
          
          // Location
          location: {
            type: 'object',
            fields: {
              name: { type: 'string', required: true },
              coordinates: {
                type: 'object',
                fields: {
                  lat: { type: 'number' },
                  lng: { type: 'number' }
                }
              }
            }
          },
          
          // Taxonomy
          webCategory: { type: 'string', required: true },
          project: { type: 'array', items: 'string' },
          concepts: { type: 'array', items: 'string' },
          
          // Cultural Legacy Markers
          intentVector: { type: 'string', required: true, description: 'Semantic purpose' },
          sdIndex: { type: 'number', required: true, description: 'Symbiotic Depth Index (0-10)' },
          
          // Media
          heroImage: { type: 'string', format: 'url' },
          
          // Content
          blocks: { type: 'array', description: 'Raw Notion blocks' },
          excerpt: { type: 'string', description: 'First 200 characters' },
          readingTime: { type: 'number', description: 'Minutes' },
          
          // AGI-First Metadata (v2.1)
          dialogue: {
            type: 'array',
            items: {
              speaker: { type: 'string' },
              text: { type: 'string' }
            },
            description: 'For comics/scripts'
          },
          philosophical_insight: {
            type: 'object',
            fields: {
              metaphor: { type: 'string' },
              reflection: { type: 'string' }
            }
          },
          emotion_trajectory: {
            type: 'object',
            fields: {
              start: { type: 'string', description: 'Starting emotion' },
              end: { type: 'string', description: 'Ending emotion' }
            }
          },
          
          // AI Integration
          embedding: { type: 'array', items: 'number', description: 'Vector embeddings (reserved)' },
          
          // Metadata
          schema_version: { type: 'string', required: true },
          last_updated: { type: 'string', required: true, format: 'ISO-8601' },
          language: { type: 'string', enum: ['zh', 'en'] }
        }
      },
      
      comic: {
        type: 'comic',
        description: 'Vertical webtoon format',
        extends: 'article',
        additional_fields: {
          episodeNumber: { type: 'number', required: true },
          season: { type: 'string' },
          philosophicalQuestion: { type: 'string' },
          panels: {
            type: 'array',
            items: {
              panelNumber: { type: 'number' },
              imageUrl: { type: 'string', format: 'url' },
              width: { type: 'number', default: 800 },
              height: { type: 'number' },
              altText: { type: 'string' },
              narration: { type: 'string' }
            }
          },
          sensoryMemory: {
            type: 'object',
            fields: {
              sight: { type: 'array', items: 'string' },
              scent: { type: 'array', items: 'string' },
              taste: { type: 'array', items: 'string' },
              touch: { type: 'array', items: 'string' },
              sound: { type: 'array', items: 'string' }
            }
          }
        }
      },
      
      podcast: {
        type: 'podcast',
        description: 'Audio content',
        extends: 'article',
        additional_fields: {
          audioFile: {
            type: 'object',
            fields: {
              url: { type: 'string', format: 'url' },
              duration: { type: 'string', format: 'MM:SS' }
            }
          },
          structure: {
            type: 'object',
            fields: {
              intro: {
                timestamp: { type: 'string' },
                summary: { type: 'string' }
              },
              mainContent: {
                timestamp: { type: 'string' },
                topics: { type: 'array', items: 'string' }
              },
              outro: {
                timestamp: { type: 'string' },
                summary: { type: 'string' }
              }
            }
          },
          transcript: { type: 'string', description: 'Full text transcript' }
        }
      }
    }
  };

  return new Response(JSON.stringify(schemas, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    }
  });
};
