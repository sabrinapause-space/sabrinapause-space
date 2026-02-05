# Sabrina's Pause

A dual-layer content platform powered by Notion, Astro, and Tailwind CSS.

## Project Overview

This is a Notion-powered static website that automatically syncs content from a Notion database and renders it as a beautiful, responsive website. Content includes articles, comics (vertical webtoon format), and podcasts.

**Key Features:**
- 🔗 Direct Notion API integration (zero-friction publishing)
- 🎨 Three content types: Articles, Comics, Podcasts
- 📊 Dual-layer architecture (Human presentation + AI-readable data)
- 🏛️ Cultural legacy markers (Intent Vector, SD-Index™)
- 📱 Fully responsive design
- ⚡ Static site generation (fast, SEO-friendly)

## Tech Stack

- **Framework:** Astro 5.x
- **Styling:** Tailwind CSS 4.x
- **Content Source:** Notion API
- **Language:** TypeScript
- **Hosting:** Vercel/Netlify (TBD)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Notion account with a database set up
- Notion integration created (get API key from https://www.notion.so/my-integrations)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sabrina-pause
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
NOTION_API_KEY=ntn_xxx
NOTION_DATABASE_ID=xxx
```

4. Share your Notion database with the integration:
   - Open your Notion database
   - Click the `...` menu (top right)
   - Click "Add connections"
   - Select your integration

5. Ensure your Notion database has the required properties:
   - **Name** or **Title** (title)
   - **Status** (select: Draft, Ready for Web, Published)
   - **Slug** (text)
   - **Content Type** (select: article, comic, podcast)
   - **Web Category** (select: journal, episodes, podcast)
   - **Date** (date)
   - **Location** (text)
   - **Project** (multi-select)
   - **Intent Vector** (text)
   - **SD-Index** or **SD-Index™** (number)
   - **Concepts** (multi-select)
   - **Hero Image** (files)

### Commands

| Command | Action |
|:---|:---|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | **Build site (includes auto-backup)** |
| `npm run preview` | Preview production build locally |
| `npm run test` | Test Notion connection |
| `npm run sample` | **Generate sample JSON output** |
| `npm run backup` | **Run GitHub backup system** |

## Development Progress

### ✅ Milestone 1: AGI-First Data Engine (COMPLETE)

**Duration:** 6-7 hours  
**Status:** ✅ COMPLETE (Updated for v2.1 AGI-First Pivot)

**Original Deliverables:**
- ✅ Astro + Tailwind CSS setup
- ✅ Notion API integration
- ✅ ContentLoader abstraction layer
- ✅ NotionLoader implementation
- ✅ Data transformation pipeline
- ✅ Block rendering system
- ✅ Test script with real data

**NEW: AGI-First Additions (v2.1):**
- ✅ JSON API Endpoints (`/api/experiences.json`, `/api/experiences/{slug}.json`, `/api/schemas.json`)
- ✅ GitHub Backup System (saves JSON to `/data/backup/YYYY-MM-DD/`)
- ✅ Enhanced Schema with AGI-first metadata fields
- ✅ Sample JSON generator

**Acceptance Criteria:**
- ✅ Console logs show structured content from Notion
- ✅ All required properties mapped correctly
- ✅ Block rendering pipeline functional
- ✅ **NEW:** JSON API endpoints accessible
- ✅ **NEW:** GitHub backup files generated
- ✅ **NEW:** Enhanced schema with dialogue, philosophical_insight, emotion_trajectory

**To verify Milestone 1:**
```bash
# Test Notion connection
npm run test

# Generate sample JSON (shows SD-Index™ and Intent Vector)
npm run sample

# Test backup system
npm run backup

# Build and test API endpoints
npm run build
npm run preview
# Then: curl http://localhost:4321/api/experiences.json
```

**Documentation:** See [MILESTONE1-AGI-FIRST.md](./MILESTONE1-AGI-FIRST.md)

### 🚧 Milestone 2: Templates & Rendering (NEXT)

**Duration:** 6-7 hours  
**Budget:** $465-$540

Coming next:
- Article detail page template
- Comic episode viewer (vertical scroll)
- Podcast player page
- Dynamic navigation component
- Category and project archive pages
- Homepage with mixed content grid
- Responsive design implementation
- Cultural legacy marker displays

### 📅 Milestone 3: Polish & Deployment (PLANNED)

- Final responsive adjustments
- SEO optimization (JSON-LD structured data)
- Live sync setup (webhook or cron)
- Deployment to Vercel/Netlify
- Performance optimization
- Lighthouse scores > 90

## Project Structure

```
sabrina-pause/
├── src/                            # Source code
│   ├── lib/                        # Core business logic
│   │   ├── notion-loader.ts        # Notion API implementation
│   │   ├── transformers.ts         # Data transformation
│   │   └── block-renderer.ts       # Block to HTML rendering
│   ├── interfaces/                 # TypeScript interfaces
│   │   └── content-loader.ts       # ContentLoader interface
│   ├── types.ts                    # TypeScript type definitions
│   ├── layouts/                    # Astro layouts
│   │   └── Layout.astro            # Base layout
│   ├── pages/                      # Astro pages (routes)
│   │   └── index.astro             # Homepage
│   └── styles/                     # Global styles
│       └── global.css              # Tailwind imports
├── tests/                          # Test files
│   └── notion-connection.test.js   # Notion API connection test
├── context.md                      # Full technical specification
├── .env                            # Environment variables (not in git)
├── .gitignore                      # Git ignore rules
├── astro.config.mjs                # Astro configuration
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # This file
```

## Content Management

All content is managed in Notion. To publish content:

1. Create or edit a page in your Notion database
2. Fill in all required properties
3. Set **Status** to **"Ready for Web"**
4. Wait for automatic rebuild (or trigger manually)

**No code editing required!**

The content will automatically appear on your website after the next build.

## Architecture

This project follows a **two-layer paradigm**:

### Layer 1: Human Presentation
- Beautiful UI/UX
- Responsive design
- SEO-optimized HTML
- Fast static generation

### Layer 2: AI-Readable Data
- Structured metadata
- Cultural legacy markers (Intent Vector, SD-Index™)
- Semantic relationships
- Future-proof for AI ingestion

**Content Flow:**
```
Notion Database → Notion API → NotionLoader → Transformers → Astro Pages → Static HTML
```

The content source (Notion) is the **single source of truth**. The website is generated from Notion data during build time.

## Key Components

### NotionLoader
Fetches content from Notion API with filtering and transformation:
- `getAll()` - Fetch all content (filtered by Status)
- `getBySlug()` - Fetch single page by slug
- `getByProject()` - Fetch pages by project tag
- `getByCategory()` - Fetch pages by web category

### Transformers
Convert Notion pages to internal schema:
- `transformToBaseContent()` - Universal properties
- `transformToArticleContent()` - Article-specific
- `transformToComicContent()` - Comic/webtoon-specific
- `transformToPodcastContent()` - Podcast-specific

### Block Renderer
Converts Notion blocks to HTML:
- Paragraphs, Headings (H1-H3)
- Lists (bulleted, numbered)
- Images, Quotes, Callouts
- Code blocks, Dividers

## Testing

### Test Notion Connection
```bash
npm run test
```

This will:
1. Connect to your Notion database
2. Fetch pages with Status = "Ready for Web"
3. Display all properties and values
4. Verify data transformation works

### Test Site Locally
```bash
npm run dev
```

Visit `http://localhost:4321` to see the site.

## Troubleshooting

### "Could not find database" error
1. Verify `NOTION_DATABASE_ID` in `.env` is correct
2. Ensure your integration has access to the database
3. Go to Notion → ... menu → Connections → Add your integration

### "Unauthorized" error
1. Check `NOTION_API_KEY` in `.env` is correct
2. Verify the integration token hasn't expired
3. Create a new integration if needed

### No pages found
1. Ensure at least one page has Status = "Ready for Web"
2. Check that all required properties exist in your database
3. Run `npm run test` to see what Notion returns

## Documentation

- [Technical Specification](./context.md) - Full project spec (v2.0)
- [Notion API Documentation](https://developers.notion.com)
- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Budget & Timeline

- **Milestone 1:** 6-7 hours ($465-$540) - ✅ COMPLETE
- **Milestone 2:** 6-7 hours ($465-$540) - 🚧 NEXT
- **Milestone 3:** 3-4 hours ($230-$310) - 📅 PLANNED

**Total:** 15-18 hours ($1,200-$1,400)

## License

Private project for Sabrina Lin.

## Support

For questions or issues, contact the developer.
