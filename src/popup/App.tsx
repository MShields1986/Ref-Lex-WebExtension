import React, { useState, useEffect } from 'react';
import { browser } from '../shared/browser';
import { User, Project, PaperMetadata, MessageResponse, RateLimitInfo } from '../shared/types';
import { ERROR_MESSAGES } from '../shared/constants';
import LoginPrompt from './components/LoginPrompt';
import PaperCard from './components/PaperCard';
import ProjectSelector from './components/ProjectSelector';
import CategoryInput from './components/CategoryInput';
import SaveButton from './components/SaveButton';
import RateLimitWarning from './components/RateLimitWarning';
import './styles.css';

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

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    paper: null,
    projects: [],
    selectedProjectId: null,
    category: '',
    rating: null,
    comment: '',
    methods: '',
    focus: '',
    keyFindings: '',
    error: null,
    success: null,
    isSaving: false,
    rateLimit: null,
    rateLimitDismissed: false,
  });

  // Initialize: Check auth and detect paper
  useEffect(() => {
    initialize();

    // Check rate limit every 30 seconds
    const rateLimitInterval = setInterval(checkRateLimit, 30000);

    return () => clearInterval(rateLimitInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initialize() {
    try {
      // Check authentication
      const authResponse = await sendMessage({ type: 'CHECK_AUTH' });

      if (!authResponse.success || !authResponse.data?.isAuthenticated) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
        }));
        return;
      }

      // Get user info
      const user = authResponse.data.user;

      // Get projects
      const projectsResponse = await sendMessage({ type: 'GET_PROJECTS' });
      const projects = projectsResponse.success ? projectsResponse.data : [];

      // Try to detect paper on current page
      const paperResponse = await sendMessage({ type: 'DETECT_PAPER' });
      const paper = paperResponse.success ? paperResponse.data : null;

      // Get default project ID from storage
      let defaultProjectId: number | null = null;
      try {
        const defaultProjectResponse = await browser.storage.local.get('default_project_id');
        defaultProjectId = defaultProjectResponse.default_project_id || null;
      } catch (error) {
        console.warn('Failed to get default project ID:', error);
      }

      // Determine which project to select
      let selectedProjectId: number | null = null;
      if (defaultProjectId && projects.find((p: Project) => p.id === defaultProjectId)) {
        // Use saved default project if it exists
        selectedProjectId = defaultProjectId;
      } else if (projects.length > 0) {
        // Otherwise use first project
        selectedProjectId = projects[0].id;
      }

      // Get rate limit info
      await checkRateLimit();

      setState(prev => ({
        ...prev,
        isLoading: false,
        isAuthenticated: true,
        user,
        projects,
        paper,
        selectedProjectId,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: getErrorMessage(error),
      }));
    }
  }

  async function checkRateLimit() {
    try {
      const rateLimitResponse = await sendMessage({ type: 'GET_RATE_LIMIT' });
      if (rateLimitResponse.success && rateLimitResponse.data) {
        setState(prev => ({
          ...prev,
          rateLimit: rateLimitResponse.data,
        }));
      }
    } catch (error) {
      console.warn('Failed to check rate limit:', error);
    }
  }

  async function sendMessage(message: { type: string; payload?: unknown }): Promise<MessageResponse> {
    return browser.runtime.sendMessage(message);
  }

  function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'An unknown error occurred';
  }

  async function handleLogin() {
    try {
      await sendMessage({ type: 'LOGIN' });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: getErrorMessage(error),
      }));
    }
  }

  async function handleLogout() {
    try {
      await sendMessage({ type: 'LOGOUT' });
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        projects: [],
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: getErrorMessage(error),
      }));
    }
  }

  async function handleSave() {
    if (!state.selectedProjectId) {
      setState(prev => ({
        ...prev,
        error: ERROR_MESSAGES.PROJECT_NOT_SELECTED,
      }));
      return;
    }

    if (!state.paper?.bibtexRaw) {
      setState(prev => ({
        ...prev,
        error: ERROR_MESSAGES.INVALID_BIBTEX,
      }));
      return;
    }

    setState(prev => ({ ...prev, isSaving: true, error: null, success: null }));

    try {
      const response = await sendMessage({
        type: 'ADD_REFERENCE',
        payload: {
          projectId: state.selectedProjectId,
          bibtex_raw: state.paper.bibtexRaw,
          comment: state.comment || undefined,
          rating: state.rating || undefined,
          methods: state.methods || undefined,
          focus: state.focus || undefined,
          key_findings: state.keyFindings || undefined,
          category: state.category || undefined,
        },
      });

      if (response.success) {
        setState(prev => ({
          ...prev,
          isSaving: false,
          success: 'Reference added successfully!',
          comment: '',
          rating: null,
          methods: '',
          focus: '',
          keyFindings: '',
          category: '',
        }));
      } else {
        setState(prev => ({
          ...prev,
          isSaving: false,
          error: response.error || 'Failed to add reference',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: getErrorMessage(error),
      }));
    }
  }

  async function handleProjectChange(projectId: number) {
    setState(prev => ({ ...prev, selectedProjectId: projectId }));

    // Save as default project
    try {
      await browser.storage.local.set({ default_project_id: projectId });
    } catch (error) {
      console.warn('Failed to save default project:', error);
    }
  }

  function handleCategoryChange(category: string) {
    setState(prev => ({ ...prev, category }));
  }

  function handleRatingChange(rating: number | null) {
    setState(prev => ({ ...prev, rating }));
  }

  function handleCommentChange(comment: string) {
    setState(prev => ({ ...prev, comment }));
  }

  function handleMethodsChange(methods: string) {
    setState(prev => ({ ...prev, methods }));
  }

  function handleFocusChange(focus: string) {
    setState(prev => ({ ...prev, focus }));
  }

  function handleKeyFindingsChange(keyFindings: string) {
    setState(prev => ({ ...prev, keyFindings }));
  }

  function handleDismissRateLimit() {
    setState(prev => ({ ...prev, rateLimitDismissed: true }));
  }

  // Loading state
  if (state.isLoading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!state.isAuthenticated) {
    return (
      <div className="app">
        <div className="header">
          <img src="/assets/icons/icon-128.png" alt="Ref-Lex" className="header-icon" />
          <div className="header-content">
            <div className="header-title">Ref-Lex</div>
            <div className="header-subtitle">Reference Manager</div>
          </div>
        </div>
        <LoginPrompt onLogin={handleLogin} />
      </div>
    );
  }

  // Authenticated
  return (
    <div className="app">
      <div className="header">
        <img src="/assets/icons/icon-128.png" alt="Ref-Lex" className="header-icon" />
        <div className="header-content">
          <div className="header-title">Ref-Lex</div>
          <div className="header-subtitle">
            Logged in as {state.user?.username}
          </div>
        </div>
      </div>

      <div className="content">
        {/* Paper Detected */}
        {state.paper ? (
          <>
            <PaperCard paper={state.paper} />

            <ProjectSelector
              projects={state.projects}
              selectedProjectId={state.selectedProjectId}
              onChange={handleProjectChange}
            />

            <CategoryInput
              value={state.category}
              onChange={handleCategoryChange}
              projectId={state.selectedProjectId}
            />

            {/* Rating */}
            <div className="form-group">
              <label htmlFor="rating">Rating (optional)</label>
              <select
                id="rating"
                className="form-select"
                value={state.rating || ''}
                onChange={(e) => handleRatingChange(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">No rating</option>
                <option value="1">1 - Poor</option>
                <option value="2">2 - Fair</option>
                <option value="3">3 - Good</option>
                <option value="4">4 - Very Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            </div>

            {/* Comment */}
            <div className="form-group">
              <label htmlFor="comment">Comment (optional)</label>
              <textarea
                id="comment"
                className="form-textarea"
                value={state.comment}
                onChange={(e) => handleCommentChange(e.target.value)}
                placeholder="Add your comments about this paper..."
                rows={1}
              />
            </div>

            {/* Methods */}
            <div className="form-group">
              <label htmlFor="methods">Methods (optional)</label>
              <textarea
                id="methods"
                className="form-textarea"
                value={state.methods}
                onChange={(e) => handleMethodsChange(e.target.value)}
                placeholder="Describe the methods used in this paper..."
                rows={1}
              />
            </div>

            {/* Focus */}
            <div className="form-group">
              <label htmlFor="focus">Focus (optional)</label>
              <textarea
                id="focus"
                className="form-textarea"
                value={state.focus}
                onChange={(e) => handleFocusChange(e.target.value)}
                placeholder="What is the main focus of this paper?"
                rows={1}
              />
            </div>

            {/* Key Findings */}
            <div className="form-group">
              <label htmlFor="keyFindings">Key Findings (optional)</label>
              <textarea
                id="keyFindings"
                className="form-textarea"
                value={state.keyFindings}
                onChange={(e) => handleKeyFindingsChange(e.target.value)}
                placeholder="Summarize the key findings..."
                rows={1}
              />
            </div>

            {/* Rate Limit Warning */}
            {state.rateLimit && !state.rateLimitDismissed && (
              <RateLimitWarning
                limit={state.rateLimit.limit}
                remaining={state.rateLimit.remaining}
                resetTime={new Date(state.rateLimit.reset * 1000)}
                onDismiss={handleDismissRateLimit}
              />
            )}

            {/* Error Message */}
            {state.error && (
              <div className="message message-error">{state.error}</div>
            )}

            {/* Success Message */}
            {state.success && (
              <div className="message message-success">{state.success}</div>
            )}

            <SaveButton
              onClick={handleSave}
              disabled={!state.selectedProjectId || state.isSaving}
              loading={state.isSaving}
            />
          </>
        ) : (
          <div className="no-paper">
            <div className="no-paper-icon">📄</div>
            <p>No academic paper detected on this page.</p>
            <p className="text-small text-muted">
              Navigate to an academic paper on ArXiv, Google Scholar, PubMed, or
              other supported sites.
            </p>
          </div>
        )}
      </div>

      <div className="footer">
        <span className="text-muted text-small">v1.0.0</span>
        <a className="footer-link" onClick={handleLogout}>
          Logout
        </a>
      </div>
    </div>
  );
};

export default App;
