# Frontend Architecture - Search & Context Extraction Separation

## Overview
The frontend has been restructured to separate search/context extraction from article generation. The homepage now focuses on search and context extraction, while article generation has moved to a dedicated `/generate` route.

## Routes

### 1. Home Page (`/`)
**Purpose:** Search the web and extract context
- **Features:**
  - Search input box with submit button
  - Live progress indicators (Searching → Crawling → Extracting → Summarizing)
  - Display extracted context summary
  - Collapsible list of sources with metadata
  - Actions: "Open in Generator", "Download Context", Auto-save indicator

### 2. Generator Page (`/generate`)
**Purpose:** Generate articles from extracted context
- **URL:** `/generate?contextId=<uuid>`
- **Features:**
  - Pre-loaded context from contextId
  - Format selector (detailed/summary/points)
  - Writing style selector
  - Generate button with progress indicator
  - Display generated article with actions (Download, Save, Regenerate)

## New Components

### UI Components
1. **ProgressSteps** (`src/components/ProgressSteps.js`)
   - Visual progress indicator for extraction steps
   - Shows current step and percentage

2. **ContextSummary** (`src/components/ContextSummary.js`)
   - Displays extracted context summary
   - Collapsible with metadata display

3. **SourceList** (`src/components/SourceList.js`)
   - Shows list of extracted sources
   - Expandable to show full content
   - Displays confidence scores and fetch time

## API Flow

### Context Extraction Flow
1. User enters query on Home page
2. Frontend calls `POST /api/search-extract` with query
3. Shows progress while extraction happens
4. Receives `context_id`, `summary`, and `sources`
5. Displays results with "Open in Generator" button

### Article Generation Flow
1. User clicks "Open in Generator" from Home
2. Navigates to `/generate?contextId=<id>`
3. Generator page calls `GET /api/context/:id` to fetch context
4. User selects format and style
5. Clicks Generate → calls `POST /api/generate` with `context_id`
6. Displays generated article

## Testing Instructions

### 1. Start the Backend Server
```bash
cd "../Akṣarajña"
python src/main.py
```
Ensure the backend is running on http://localhost:8000

### 2. Configure Frontend Environment
Update `.env` file with your Supabase publishable key:
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SUPABASE_URL=https://pvarvmjbazehivkiuosk.supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY_HERE
```

### 3. Start the Frontend
```bash
npm start
```
The app will open at http://localhost:3000

### 4. Test the Flow

#### Test Search & Extraction:
1. Navigate to home page (`/`)
2. Enter a search query (e.g., "artificial intelligence")
3. Click "Search & Extract"
4. Watch the progress steps
5. Verify context summary appears
6. Check sources are listed with expand functionality

#### Test Generation:
1. After extraction, click "Open in Generator"
2. Verify URL changes to `/generate?contextId=<uuid>`
3. Confirm context is pre-loaded
4. Select format (detailed/summary/points)
5. Click "Generate Article"
6. Verify article is generated and displayed

#### Test Actions:
- **Download Context:** Downloads JSON file with context data
- **Download Article:** Downloads markdown file of generated article
- **Save to My Articles:** Saves article to user's collection
- **Regenerate:** Generates a new version of the article

## File Structure

```
src/
├── pages/
│   ├── Home.js          # Search & context extraction page
│   ├── Home.css         # Styles for home page
│   ├── Generator.js     # Article generation page
│   └── Generator.css    # Styles for generator page
├── components/
│   ├── ProgressSteps.js    # Progress indicator component
│   ├── ProgressSteps.css
│   ├── ContextSummary.js   # Context display component
│   ├── ContextSummary.css
│   ├── SourceList.js       # Sources list component
│   └── SourceList.css
└── App.js                   # Updated with routing
```

## Modified Files

### Updated Files:
1. `src/App.js` - Added React Router and route configuration
2. `package.json` - Added react-router-dom dependency

### New Files:
1. `src/pages/Home.js` - Home page component
2. `src/pages/Home.css` - Home page styles
3. `src/pages/Generator.js` - Generator page component
4. `src/pages/Generator.css` - Generator page styles
5. `src/components/ProgressSteps.js` - Progress indicator
6. `src/components/ProgressSteps.css`
7. `src/components/ContextSummary.js` - Context summary display
8. `src/components/ContextSummary.css`
9. `src/components/SourceList.js` - Sources list display
10. `src/components/SourceList.css`

## Key Features

### Home Page Features:
- ✅ Clean search interface
- ✅ Real-time progress tracking
- ✅ Context summary display (read-only)
- ✅ Expandable sources with metadata
- ✅ Download context as JSON
- ✅ Auto-save indicator

### Generator Page Features:
- ✅ Pre-loaded context from URL parameter
- ✅ Format selection (detailed/summary/points)
- ✅ Writing style selection
- ✅ Live generation progress
- ✅ Generated article display
- ✅ Download/Save/Regenerate actions

## Error Handling

- **401/403 Errors:** Authentication prompts
- **404 Context Not Found:** Friendly error with return to search
- **Network Errors:** Retry options
- **Rate Limiting:** User notification

## Notes

- No backend changes required - uses existing API endpoints
- Frontend maintains authentication via Supabase
- Context is auto-saved and accessible via context_id
- Sources are properly attributed with clickable links

## Acceptance Criteria Met

✅ Home page triggers `POST /api/search-extract` and shows progress  
✅ Displays summary and sources after extraction  
✅ "Open in Generator" navigates to `/generate?contextId=<id>`  
✅ Generator loads context via `GET /api/context/:id`  
✅ Generate button calls `POST /api/generate`  
✅ Article is displayed and can be saved/downloaded  
✅ No backend changes required  
✅ Uses existing API endpoints
