# Chrome Web Store Privacy Disclosure

This document contains the privacy disclosures required for the Chrome Web Store listing. Use this when filling out the "Privacy practices" section of your Chrome Web Store Developer Dashboard.

## Privacy Policy URL

**Full Privacy Policy**: `https://github.com/MShields1986/Ref-Lex-WebExtension/blob/main/PRIVACY_POLICY.md`

## Single Purpose Description

**Extension's Single Purpose:**
"The Ref-Lex Browser Extension allows users to quickly save academic papers to their Ref-Lex reference manager account by detecting and extracting bibliographic metadata from academic websites."

## Permission Justifications

When asked to justify permissions in the Chrome Web Store, use these explanations:

### activeTab
**Justification**: "Required to read academic paper metadata (title, authors, DOI, abstract) from the current page when the user clicks the extension icon. This allows automatic extraction of bibliographic data from supported academic publishers."

### storage
**Justification**: "Required to cache user authentication state, project list, and preferences locally to improve performance and reduce server requests. No sensitive data is stored."

### cookies
**Justification**: "Required to read the authentication cookie (JWT token) set by the Ref-Lex backend (ref-lex.site) to verify the user's login session and make authenticated API requests."

### sidePanel
**Justification**: "Required to display the extension's user interface in the browser sidebar for a non-intrusive user experience when adding references."

### host_permissions: <all_urls>
**Justification**: "Required to:
1. Extract bibliographic metadata from any academic publisher website (many universities and research institutions host papers on their own domains)
2. Fetch BibTeX data from DOI resolvers (doi.org) and ArXiv API
3. Communicate with the Ref-Lex backend API (ref-lex.site)

The extension ONLY accesses content when the user explicitly opens it on an academic paper page. No tracking or data collection occurs on non-academic websites."

## Data Usage Disclosure

**What data does this extension collect?**

✅ **User account information** (username, email) - cached from the Ref-Lex backend API
✅ **Authentication tokens** - JWT cookie from ref-lex.site for login session management
✅ **Paper metadata** - bibliographic data (title, authors, DOI, etc.) extracted from academic websites when you add a reference
✅ **User preferences** - project selection, cached categories for improved performance

❌ **Browsing history** - NOT collected
❌ **Personal communications** - NOT collected
❌ **Website content** (beyond academic paper metadata) - NOT collected
❌ **Financial information** - NOT collected
❌ **User activity** - NOT collected or tracked

**How is this data used?**

- **Service functionality**: To authenticate users and save bibliographic references to their Ref-Lex account
- **Performance**: To cache data locally and reduce server load
- **No other purposes**: Data is NOT used for advertising, analytics, or any other purpose

**Is data shared with third parties?**

✅ **Ref-Lex backend (ref-lex.site)** - Paper metadata and authentication data is sent to the user's own Ref-Lex account
✅ **DOI/ArXiv APIs** - DOI or ArXiv ID is sent to these services to fetch BibTeX data (standard academic practice)

❌ **Advertisers** - NO
❌ **Analytics services** - NO
❌ **Data brokers** - NO
❌ **Marketing companies** - NO

**Data security:**

- All API communication uses HTTPS encryption
- Authentication cookies are httpOnly (protected from XSS attacks)
- CSRF token protection on all API requests
- Strict Content Security Policy prevents code injection
- Open source code available for audit

## Prominent Disclosure (For Store Listing Description)

Include this in your Chrome Web Store description:

```
🔒 PRIVACY & SECURITY

Your privacy is important to us:
• No tracking or analytics
• No ads or third-party data sharing
• Data only sent to YOUR Ref-Lex account
• Open source for full transparency
• Full privacy policy: https://github.com/MShields1986/Ref-Lex-WebExtension/blob/main/PRIVACY_POLICY.md

This extension only accesses academic paper metadata when you explicitly open it. It does not track your browsing or collect data from non-academic websites.
```

## Limited Use Disclosure (Required by Chrome Web Store)

**Certification Statement:**
"The Ref-Lex Browser Extension's use of information received from Google APIs adheres to the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/#userdata), including the Limited Use requirements."

**Limited Use Compliance:**

1. **Prominent Disclosure**: This privacy policy prominently discloses data collection and use
2. **Single Purpose**: Extension has a single, clear purpose (academic reference management)
3. **Limited Use**: Data from websites is only used to extract bibliographic metadata for the reference management service
4. **Secure Transfer**: All data transmitted to ref-lex.site uses HTTPS
5. **No Sale**: User data is never sold to third parties
6. **No Advertising**: Data is not used for advertising purposes
7. **No Creditworthiness**: Data is not used to determine creditworthiness or lending eligibility

## Developer Contact Information

**Support Email**: the-librarian@ref-lex.site
**Website**: https://ref-lex.site
**Source Code**: https://github.com/MShields1986/Ref-Lex-WebExtension

## Additional Store Listing Information

### Category
**Recommended Category**: Productivity

### Tags/Keywords
- reference manager
- bibliography
- academic research
- bibtex
- citation management
- research tools
- academic papers
- scholarly articles

### Target Audience
- Academic researchers
- Graduate students
- Professors and educators
- Research professionals
- Anyone managing academic references

### Age Rating
**Recommended**: Everyone (no age restrictions)

**Justification**: The extension is a productivity tool for academic research with no inappropriate content, advertising, or data collection practices that would require age restrictions.
