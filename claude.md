# Ref-Lex Web Extension - Developer Guide for Claude

## Project Overview

**Ref-Lex Web Extension** is a browser extension (Chrome/Firefox) that allows users to quickly capture academic papers from websites and save them to their Ref-Lex reference manager projects. The extension detects paper metadata, generates BibTeX citations, and provides a streamlined UI for organizing references.

**Current Status:** Phase 4 of 7 complete ✅
**Version:** 1.0.0
**Last Updated:** 2025-11-29

## Architecture

### Extension Components

The extension follows the standard Manifest V3 architecture with three main components:

1. **Background Service Worker** (`src/background/`)
   - Handles authentication and API communication
   - Manages storage and caching
   - Coordinates between content scripts and popup

2. **Content Scripts** (`src/content/`)
   - Injected into academic paper pages
   - Detects and extracts paper metadata
   - Supports 9 academic sites + generic detection

3. **Sidebar UI** (`src/popup/`)
   - React-based user interface in a browser sidebar
   - Displays detected paper information
   - Allows project/category selection and note-taking
   - Full-height vertical layout for better UX

4. **Options Page** (`src/options/`)
   - Configuration interface for API settings
   - User preferences management

### Technology Stack

- **Language:** TypeScript
- **UI Framework:** React 18.2
- **Build Tool:** Webpack 5
- **Browser API:** webextension-polyfill (cross-browser compatibility)
- **Styling:** Custom CSS with Catppuccin Mocha theme
- **Package Manager:** npm

## Project Structure

```
src/
├── background/           # Service worker and backend logic
│   ├── service-worker.ts # Main background script, message handling
│   ├── api.ts           # API client with CSRF protection
│   ├── auth.ts          # Authentication logic
│   └── storage.ts       # Storage and caching utilities
│
├── content/             # Content scripts for paper detection
│   ├── inject.ts        # Main content script entry point
│   ├── bibtex-generator.ts # BibTeX generation utilities
│   └── detectors/       # Site-specific paper detectors
│       ├── index.ts     # Detector registry and routing
│       ├── arxiv.ts     # ArXiv.org detector
│       ├── scholar.ts   # Google Scholar detector
│       ├── pubmed.ts    # PubMed detector
│       ├── ieee.ts      # IEEE Xplore detector
│       ├── acm.ts       # ACM Digital Library detector
│       ├── springer.ts  # SpringerLink detector
│       ├── sciencedirect.ts # ScienceDirect detector
│       ├── jstor.ts     # JSTOR detector
│       └── generic.ts   # Generic metadata detector
│
├── popup/               # Sidebar UI (React)
│   ├── index.tsx        # React app entry point
│   ├── App.tsx          # Main application component
│   ├── styles.css       # Catppuccin Mocha theme styles (sidebar optimized)
│   ├── popup.html       # HTML template (full-height sidebar)
│   └── components/      # React components
│       ├── ErrorBoundary.tsx    # Error handling wrapper
│       ├── RateLimitWarning.tsx # Rate limit notification
│       ├── LoginPrompt.tsx      # Authentication UI
│       ├── PaperCard.tsx        # Paper metadata display
│       ├── ProjectSelector.tsx  # Project dropdown
│       ├── CategoryInput.tsx    # Category selection/creation
│       └── SaveButton.tsx       # Submit button
│
│   Note: NotesEditor.tsx exists but is not currently used - form fields (comment, methods,
│   focus, keyFindings) are handled inline in App.tsx for simplicity.
│
├── options/             # Options page
│   ├── index.tsx        # Options page entry
│   ├── OptionsPage.tsx  # Options UI component
│   └── options.html     # HTML template
│
└── shared/              # Shared utilities and types
    ├── types.ts         # TypeScript type definitions
    ├── constants.ts     # Constants, endpoints, error messages
    ├── utils.ts         # Utility functions
    └── browser.ts       # Browser API polyfill wrapper
```

## Key Features & Implementation

### Phase 1: Project Setup ✅
- Docker development environment
- TypeScript + Webpack build pipeline
- Manifest V3 structure
- Cross-browser compatibility setup

### Phase 2: Core Functionality ✅
- **Authentication:** Cookie-based JWT authentication
- **API Client:** CSRF-protected API requests
- **Storage:** Cached projects/categories with timeout
- **UI:** React popup with Catppuccin theme
- **Paper Detection:** ArXiv and generic metadata extraction

### Phase 3: Additional Detectors ✅
Implemented 7 additional paper detectors:
- Google Scholar (citation meta tags)
- PubMed (PMID, DOI extraction)
- IEEE Xplore (conference/journal papers)
- ACM Digital Library
- SpringerLink
- ScienceDirect
- JSTOR

**Total:** 9 detectors (1,187 lines of detection code)

### Phase 4: Polish & Features ✅
- **Error Boundary:** React error handling with recovery UI
- **Enhanced Error Messages:** 21 contextual, actionable error messages
- **Rate Limit Warning:** Visual warning when approaching API limits (25% threshold)
- **Default Project Selection:** Remembers last-used project in localStorage
- **Sidebar UI:** Converted from popup to sidebar for better vertical space and UX
- **Extended Metadata Fields:** Added rating (1-5), comment, methods, focus, and key findings fields
- **Browser-Specific Builds:** Separate manifests for Chrome (side_panel) and Firefox (sidebar_action)

## Development Workflow

### Building the Extension

**Cross-Browser Compatibility:**

The extension uses separate manifest files for Chrome and Firefox due to browser-specific requirements:

- `manifest-chrome.json` - Uses `service_worker` and `side_panel` (Chrome-specific sidebar API)
- `manifest-firefox.json` - Uses `scripts` array and `sidebar_action` (Firefox sidebar API)

During build, webpack copies the appropriate manifest to `dist/manifest.json` based on the target browser.

```bash
# Build for Chrome/Edge only
make build-chrome

# Build for Firefox only
make build-firefox

# Build both (for CI/CD - last build overwrites dist/)
make build-all

# Development mode with watch
make dev

# Clean build artifacts
make clean
```

### Docker Development

The project uses Docker for consistent builds:

```bash
# Open shell in container
make shell

# Run tests
make test
```

### Testing Locally

**Chrome/Edge:**
1. Build the extension: `make build-chrome`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist/` folder
6. Click the extension icon to open the sidebar

**Firefox:**
1. Build the extension: `make build-firefox`
2. Open `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select any file in the `dist/` folder (e.g., `manifest.json`)
5. Click the extension icon to open the sidebar

**Important:** Always run the browser-specific build command before testing. Don't try to load a Chrome build in Firefox or vice versa - they use incompatible manifest formats.

## Code Patterns & Conventions

### Message Passing

The extension uses a typed message passing system:

```typescript
// Message types defined in src/shared/types.ts
type MessageType =
  | 'CHECK_AUTH'
  | 'LOGIN'
  | 'LOGOUT'
  | 'GET_PROJECTS'
  | 'GET_CATEGORIES'
  | 'ADD_REFERENCE'
  | 'DETECT_PAPER'
  | 'PAPER_DETECTED'
  | 'GET_RATE_LIMIT'
  | 'OPEN_OPTIONS';

// Sending messages from popup/content
const response = await browser.runtime.sendMessage({
  type: 'GET_PROJECTS',
  payload: { forceRefresh: true }
});

// Handling in background service worker
browser.runtime.onMessage.addListener((message, sender) => {
  return handleMessage(message, sender);
});
```

### Storage Pattern

```typescript
// Background service worker manages storage
import { browser } from '../shared/browser';
import { STORAGE_KEYS } from '../shared/constants';

// Cache with timestamp
export interface CachedProjects {
  projects: Project[];
  timestamp: number;
}

// Get with expiration check
export async function getCachedProjects(): Promise<Project[] | null> {
  const result = await browser.storage.local.get(STORAGE_KEYS.CACHED_PROJECTS);
  const cached = result[STORAGE_KEYS.CACHED_PROJECTS] as CachedProjects | undefined;

  if (!cached || isExpired(cached.timestamp, CACHE_CONFIG.PROJECTS_CACHE_TIMEOUT)) {
    return null;
  }

  return cached.projects;
}
```

### API Client Pattern

```typescript
// All API requests go through apiRequest() in src/background/api.ts
async function apiRequest<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  // 1. Add JWT cookie from browser.cookies
  // 2. Add CSRF token for non-GET requests
  // 3. Parse rate limit headers
  // 4. Handle 401 with CSRF token refresh
  // 5. Throw typed errors (AuthenticationError, NetworkError, etc.)
}

// Usage
const projects = await apiRequest<Project[]>(API_ENDPOINTS.PROJECTS, {
  method: 'GET',
});
```

### Paper Detection Pattern

Each detector implements the same interface:

```typescript
// src/content/detectors/[site].ts
export async function detect[Site]Paper(): Promise<PaperMetadata | null> {
  // 1. Check if on correct site
  if (!window.location.hostname.includes('site.com')) return null;

  // 2. Extract metadata from DOM
  const title = document.querySelector('selector')?.textContent;
  const authors = extractAuthors();
  const doi = extractDoi();

  // 3. Try to fetch BibTeX from DOI
  let bibtexRaw = doi ? await fetchBibtexFromDoi(doi) : null;

  // 4. Fall back to generated BibTeX
  if (!bibtexRaw) {
    bibtexRaw = generateBibtex({ title, authors, ... });
  }

  // 5. Return standardized metadata
  return {
    title,
    authors,
    year,
    doi,
    url: window.location.href,
    source: 'site',
    bibtexRaw,
  };
}
```

### React Component Pattern

```typescript
// Functional components with TypeScript
interface ComponentProps {
  value: string;
  onChange: (value: string) => void;
}

const Component: React.FC<ComponentProps> = ({ value, onChange }) => {
  const [state, setState] = useState<SomeType>(initialValue);

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  return (
    <div className="component">
      {/* JSX */}
    </div>
  );
};

export default Component;
```

## Important Files

### Core Configuration

- **manifest.json** - Extension manifest (Manifest V3 with sidebar support)
- **package.json** - Dependencies and build scripts
- **tsconfig.json** - TypeScript configuration
- **webpack.config.js** - Webpack build configuration
- **Dockerfile** - Docker build environment
- **Makefile** - Build commands

### Shared Resources

- **src/shared/types.ts** - All TypeScript interfaces and types
- **src/shared/constants.ts** - API endpoints, error messages, storage keys
- **src/shared/utils.ts** - Utility functions (validation, parsing, etc.)
- **src/shared/browser.ts** - Browser API polyfill wrapper

### Documentation

- **README.md** - User-facing documentation
- **NEXT_STEPS.md** - Development roadmap and status
- **PHASE_3_SUMMARY.md** - Phase 3 implementation details
- **PHASE_4_SUMMARY.md** - Phase 4 implementation details
- **claude.md** - This file (developer guide)

## API Integration

### Backend Requirements

The extension requires a Ref-Lex backend with the following endpoints:

**Authentication:**
- `GET /api/csrf-token` - Get CSRF token
- `GET /api/account` - Get current user info
- `POST /api/login` - Login (redirects to backend)
- `POST /api/logout` - Logout

**Projects:**
- `GET /api/projects` - List user's projects
- `GET /api/projects/:id` - Get project details

**References:**
- `POST /api/projects/:id/references` - Add reference to project
- `GET /api/projects/:id/references` - List project references

**Categories:**
- `GET /api/projects/:id/categories` - List project categories

### Rate Limiting

The API should return these headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 75
X-RateLimit-Reset: 1638360000
```

Extension will display a warning when `remaining < limit * 0.25`.

## Error Handling

### Error Types

Defined in `src/shared/types.ts`:

```typescript
export class ExtensionError extends Error {
  constructor(message: string, code?: string, statusCode?: number);
}

export class AuthenticationError extends ExtensionError {}
export class NetworkError extends ExtensionError {}
export class ValidationError extends ExtensionError {}
```

### Error Messages

All error messages are centralized in `src/shared/constants.ts`:

```typescript
export const ERROR_MESSAGES = {
  // Authentication
  AUTH_REQUIRED: 'Please log in to use this feature',
  EMAIL_NOT_VERIFIED: 'Please verify your email address...',

  // Network
  NETWORK_ERROR: 'Unable to connect to Ref-Lex...',
  SERVER_ERROR: 'The Ref-Lex server encountered an error...',

  // Paper Detection
  NO_PAPER_DETECTED: 'No academic paper detected...',
  INVALID_BIBTEX: 'Could not generate valid BibTeX...',

  // ... 21 total error messages
};
```

### Error Boundary

React errors are caught by `ErrorBoundary` component:

```typescript
// src/popup/index.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

Shows user-friendly error UI with:
- Error message and stack trace
- "Try Again" button
- "Reload Extension" button

## Styling

### Theme: Catppuccin Mocha

All colors defined in `src/popup/styles.css`:

```css
:root {
  --base: #1e1e2e;
  --text: #cdd6f4;
  --blue: #89b4fa;
  --green: #a6e3a1;
  --red: #f38ba8;
  --yellow: #f9e2af;
  /* ... more colors */
}
```

### Component Classes

- `.app` - Main container
- `.header` - Extension header with icon
- `.content` - Main content area
- `.form-group` - Form field container
- `.form-label` - Field label
- `.form-input` / `.form-select` / `.form-textarea` - Input fields
- `.btn` / `.btn-primary` / `.btn-secondary` - Buttons
- `.message` / `.message-error` / `.message-success` - Notifications
- `.paper-card` - Paper metadata display
- `.error-boundary` - Error UI
- `.rate-limit-warning` - Rate limit notification

## State Management

### Popup State

All state managed in `src/popup/App.tsx`:

```typescript
interface AppState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  paper: PaperMetadata | null;
  projects: Project[];
  selectedProjectId: number | null;
  category: string;
  rating: number | null;
  comment: string;
  methods: string;
  focus: string;
  keyFindings: string;
  error: string | null;
  success: string | null;
  isSaving: boolean;
  rateLimit: RateLimitInfo | null;
  rateLimitDismissed: boolean;
}
```

### Persistent State

Stored in `browser.storage.local`:

- `auth_state` - Authentication status
- `cached_projects` - Projects with timestamp
- `cached_categories` - Categories with timestamp
- `api_base_url` - Custom API URL
- `default_project_id` - Last selected project
- `last_detected_paper` - Current paper metadata
- `last_auth_check` - Last authentication check timestamp
- `csrf_token` - CSRF token for API requests
- `rate_limit_info` - Rate limit data with reset time

## Testing Strategy

### Manual Testing Checklist

**Authentication:**
- [ ] Login flow works
- [ ] Logout clears session
- [ ] Session persists across popup opens
- [ ] Email verification error shows correctly

**Paper Detection:**
- [ ] ArXiv papers detected
- [ ] Google Scholar papers detected
- [ ] PubMed papers detected
- [ ] IEEE papers detected
- [ ] ACM papers detected
- [ ] SpringerLink papers detected
- [ ] ScienceDirect papers detected
- [ ] JSTOR papers detected
- [ ] Generic sites with DOI work
- [ ] No false positives on non-paper pages

**Reference Saving:**
- [ ] Can select project
- [ ] Can add category
- [ ] Can add notes
- [ ] Success message displays
- [ ] Reference appears in backend
- [ ] Error messages clear and helpful

**UX Features:**
- [ ] Default project remembered
- [ ] Rate limit warning shows when low
- [ ] Error boundary catches React errors
- [ ] All fields marked as optional (except Project)

### Future Testing (Phase 5)

- Unit tests for utilities
- Integration tests for API client
- E2E tests with Puppeteer
- Cross-browser testing

## Common Tasks

### Adding a New Paper Detector

1. Create `src/content/detectors/newsite.ts`:
```typescript
export async function detectNewSitePaper(): Promise<PaperMetadata | null> {
  if (!window.location.hostname.includes('newsite.com')) return null;
  // ... implementation
}
```

2. Register in `src/content/detectors/index.ts`:
```typescript
import { detectNewSitePaper } from './newsite';

const detectors = [
  detectArxivPaper,
  detectScholarPaper,
  detectNewSitePaper, // Add here
  // ...
];
```

3. Add to constants in `src/shared/constants.ts`:
```typescript
export const PAPER_SOURCES = {
  // ...
  NEWSITE: 'newsite',
} as const;

export const SUPPORTED_SITES = [
  // ...
  { name: 'NewSite', pattern: 'newsite.com', detector: PAPER_SOURCES.NEWSITE },
];
```

### Adding a New Message Type

1. Add to `src/shared/types.ts`:
```typescript
export type MessageType =
  | 'EXISTING_TYPE'
  | 'NEW_MESSAGE_TYPE';
```

2. Add handler in `src/background/service-worker.ts`:
```typescript
async function handleMessage(message: Message): Promise<MessageResponse> {
  switch (message.type) {
    case 'NEW_MESSAGE_TYPE':
      return await handleNewMessage(message.payload);
    // ...
  }
}

async function handleNewMessage(payload: any): Promise<MessageResponse> {
  // Implementation
}
```

### Adding a New Error Message

Add to `src/shared/constants.ts`:

```typescript
export const ERROR_MESSAGES = {
  // ...
  NEW_ERROR_TYPE: 'Clear, actionable error message with context.',
} as const;
```

### Updating Styles

Edit `src/popup/styles.css`:

```css
/* Use Catppuccin color variables */
.new-component {
  background-color: var(--surface0);
  color: var(--text);
  border: 1px solid var(--blue);
}
```

## Build Output

After running `make build`, the `dist/` folder contains:

```
dist/
├── manifest.json         # Extension manifest (with sidebar config)
├── popup.html           # Sidebar page
├── options.html         # Options page
├── popup.js             # Sidebar bundle (170 KiB)
├── content.js           # Content script bundle (28.2 KiB)
├── background.js        # Service worker bundle (23.8 KiB)
├── options.js           # Options page bundle (10.5 KiB)
└── assets/
    └── icons/
        ├── icon-16.png
        ├── icon-48.png
        └── icon-128.png
```

**Total Size:** ~233 KiB (minified)

## Environment Variables

Optional environment variables (in `.env.development` or `.env.production`):

```bash
API_BASE_URL=http://localhost:80  # Backend API URL
```

Default API URL: `http://localhost:80`

## Browser Compatibility

**Minimum Versions:**
- Chrome/Edge: 109+
- Firefox: 109+

**Manifest Version:** 3

**Polyfill:** Uses `webextension-polyfill` for cross-browser compatibility

## Future Phases

### Phase 5: Testing (Next)
- Unit tests for utilities
- Integration tests for API client
- E2E tests with Puppeteer
- Manual testing checklist completion

### Phase 6: Documentation
- User guide with screenshots
- Video tutorial
- API documentation
- Contributing guide

### Phase 7: Distribution
- Chrome Web Store submission
- Firefox Add-ons submission
- GitHub releases with builds
- Update mechanism

## Troubleshooting

### Extension won't load
- Check that `dist/` folder contains all files
- Check browser console for errors
- Try rebuilding: `make clean && make build`

### Sidebar won't open
- Click the extension icon in the toolbar
- **Chrome/Edge**: Check if sidePanel permission is granted
- **Firefox**: Try using the sidebar menu (View → Sidebar)
- Check browser console for errors

### Paper not detected
- Check browser console on paper page for `[Ref-Lex]` logs
- Verify content script is injected (DevTools → Sources)
- Check URL matches supported site patterns
- Some sites require being on article page (not search results)
- Make sure the sidebar is open when on a paper page

### API calls failing
- Verify backend is running
- Check CORS settings on backend
- Verify cookies are being sent
- Check CSRF token is included in requests

### Build errors
- Check TypeScript errors: Look for `[tsl] ERROR` in output
- Verify all dependencies installed: `npm install` in container
- Check webpack configuration for syntax errors

## Development Tips

1. **Use the Makefile:** All common commands are in the Makefile
2. **Check Phases:** Review `NEXT_STEPS.md` for current status
3. **Read Phase Summaries:** `PHASE_3_SUMMARY.md` and `PHASE_4_SUMMARY.md` have detailed implementation notes
4. **Follow Patterns:** Stick to established patterns for consistency
5. **Use TypeScript:** All code should be strongly typed
6. **Test in Both Browsers:** Chrome and Firefox have subtle differences (especially sidebar APIs)
7. **Check Console Logs:** Extension logs extensively for debugging
8. **Use React DevTools:** Install for easier sidebar UI debugging

## Key Dependencies

**Runtime:**
- `react@18.2.0` - UI framework
- `react-dom@18.2.0` - React DOM renderer
- `webextension-polyfill@0.10.0` - Cross-browser API

**Build:**
- `typescript@5.3.3` - TypeScript compiler
- `webpack@5.89.0` - Module bundler
- `ts-loader@9.5.1` - TypeScript loader for webpack

**Development:**
- `@types/chrome@0.0.253` - Chrome API types
- `@types/react@18.2.45` - React types
- `web-ext@7.9.0` - Firefox extension development tool

## Performance

**Bundle Sizes:**
- Popup: 170 KiB (includes React)
- Content: 28.2 KiB (all detectors)
- Background: 23.5 KiB
- Options: 10.5 KiB

**Optimizations:**
- Webpack production mode (minification, tree-shaking)
- Cached projects/categories (5-minute timeout)
- Lazy loading of detectors
- Debounced input handlers

## Security Considerations

1. **CSRF Protection:** All POST/PUT/DELETE requests include CSRF token
2. **Cookie Security:** JWT stored in httpOnly cookies
3. **Content Security Policy:** Strict CSP in manifest
4. **Input Validation:** All user input sanitized
5. **No eval():** Code follows CSP, no dynamic code execution
6. **Permissions:** Minimal permissions requested

## Contact & Support

For questions about this codebase:
- Check `NEXT_STEPS.md` for current development status
- Review phase summaries for implementation details
- Check issue tracker for known issues

---

**Last Updated:** 2025-11-29
**Phase:** 4 of 7 Complete
**Status:** Production-ready for manual testing
**UI Mode:** Sidebar (Chrome side panel / Firefox sidebar)
