# Privacy Policy - Ref-Lex Browser Extension

**Last Updated: 30 November 2025**

## 1. Introduction

This Privacy Policy explains how the Ref-Lex Browser Extension ("Extension", "we", "us", "our") collects, uses, stores, and protects your personal data when you use our browser extension for Chrome, Edge, and Firefox.

The Extension is a companion tool to the Ref-Lex web application (https://ref-lex.site) and works in conjunction with it. This Privacy Policy should be read alongside the [Ref-Lex Web Application Privacy Policy](https://github.com/MShields1986/Ref-Lex/blob/main/PRIVACY_POLICY.md).

We are committed to protecting your privacy and complying with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.

By installing and using the Extension, you agree to the collection and use of information in accordance with this Privacy Policy.

## 2. Data Controller

For the purposes of data protection law, the data controller is:
- **Service Name**: Ref-Lex
- **Contact Email**: the-librarian@ref-lex.site
- **Location**: United Kingdom

## 3. What the Extension Does

The Ref-Lex Browser Extension allows you to:
- **Detect academic papers** on websites like ArXiv, Google Scholar, PubMed, IEEE Xplore, ACM, SpringerLink, ScienceDirect, and JSTOR
- **Extract bibliographic metadata** (titles, authors, DOIs, abstracts) from these pages
- **Add references** to your Ref-Lex projects directly from your browser
- **Authenticate** with the Ref-Lex web application to access your account

The Extension does **NOT**:
- Track your browsing history
- Collect data from non-academic websites
- Store or transmit any personal data beyond what's necessary for its functionality
- Use analytics or tracking services
- Display advertisements
- Share data with third parties (except the Ref-Lex backend)

## 4. Browser Permissions Explained

The Extension requires certain browser permissions to function. Here's what each permission is used for:

### 4.1 `activeTab`
**Purpose**: Detect and extract academic paper metadata from the page you're currently viewing.

**What it does**:
- Reads the HTML content of academic paper pages when you click the Extension icon
- Extracts bibliographic data (title, authors, publication year, DOI, abstract)
- Reads meta tags and structured data specific to academic publishers

**What it does NOT do**:
- Track which websites you visit
- Read content from pages you haven't explicitly opened the Extension on
- Access data from other tabs or windows
- Store browsing history

### 4.2 `storage`
**Purpose**: Store your authentication state and cache data locally in your browser.

**What it stores**:
- Authentication status (whether you're logged in)
- Your user information (username, email) - cached from the backend
- Your projects list (cached for 5 minutes to reduce server load)
- Your categories per project (cached for 5 minutes)
- CSRF token for security
- API base URL (default: https://ref-lex.site)
- Last detected paper metadata (temporary, cleared when you close the sidebar)
- Rate limit information (from backend API)

**What it does NOT store**:
- Your password (passwords are never stored in the Extension)
- Browsing history
- Data from non-academic websites
- Third-party tracking data

### 4.3 `cookies`
**Purpose**: Read the authentication cookie set by the Ref-Lex backend to maintain your login session.

**What it does**:
- Reads the `access_token_cookie` set by ref-lex.site when you log in
- Verifies you're logged in by checking for the presence of this cookie
- Includes the cookie when making API requests to the backend

**What it does NOT do**:
- Set cookies on third-party websites
- Track your activity across websites
- Share cookies with advertisers or analytics services
- Access cookies from other websites

**Important**: The authentication cookie is an **httpOnly cookie** set by the Ref-Lex backend. The Extension only reads this cookie; it does not create or modify it.

### 4.4 `sidePanel` (Chrome/Edge only)
**Purpose**: Display the Extension's user interface in the browser sidebar.

**What it does**:
- Opens the Extension interface in the browser's side panel
- Provides a persistent, non-intrusive UI for adding references

**What it does NOT do**:
- Collect any data
- Access other panels or browser UI

### 4.5 `host_permissions: <all_urls>`
**Purpose**: Access academic websites to extract paper metadata and fetch BibTeX data from external sources.

**What it accesses**:
- **Academic publisher websites**: ArXiv, Google Scholar, PubMed, IEEE, ACM, Springer, ScienceDirect, JSTOR
- **DOI resolution**: https://doi.org/* to fetch BibTeX from CrossRef
- **ArXiv API**: https://arxiv.org/bibtex/* to fetch BibTeX for ArXiv papers
- **Ref-Lex backend**: https://ref-lex.site for API communication

**Why `<all_urls>`**:
We use `<all_urls>` to support:
- Generic detection on any academic website (many universities host papers on their own domains)
- Fetching BibTeX from various DOI resolvers and academic services
- Supporting new academic publishers without requiring Extension updates

**What it does NOT do**:
- Read or store content from non-academic websites
- Track your browsing on non-academic sites
- Inject ads or modify page content
- Send data from arbitrary websites to our servers

**Data collected from web pages**:
When you activate the Extension on an academic paper page, we extract:
- Paper title
- Author names
- Publication year
- DOI (Digital Object Identifier)
- Journal or conference name
- Abstract (if available)
- URL of the page

This data is sent to the Ref-Lex backend only when you explicitly click "Add to Ref-Lex".

## 5. What Personal Data We Collect

### 5.1 Authentication Data
- **Login status**: Whether you're currently logged in to Ref-Lex
- **User information**: Username and email (cached from backend API)
- **Authentication cookie**: JWT token set by ref-lex.site (httpOnly cookie)
- **CSRF token**: For security when making API requests

**Legal Basis**: Contractual necessity (Article 6(1)(b) UK GDPR) - necessary to authenticate you and provide the Service.

### 5.2 Paper Metadata from Web Pages
When you open the Extension on an academic paper page, we extract:
- **Bibliographic data**: Title, authors, year, DOI, journal, abstract
- **Page URL**: The URL of the academic paper page
- **BibTeX data**: Generated from metadata or fetched from DOI/ArXiv APIs

This data is only sent to the Ref-Lex backend when you click "Add to Ref-Lex".

**Legal Basis**: Contractual necessity (Article 6(1)(b) UK GDPR) - necessary to provide the reference management service you requested.

### 5.3 Usage Data (Stored Locally Only)
- **Cached projects and categories**: Stored locally for 5 minutes to reduce server requests
- **Last detected paper**: Stored temporarily while the sidebar is open
- **API base URL**: Configurable in Extension settings (defaults to https://ref-lex.site)

**Legal Basis**: Legitimate interests (Article 6(1)(f) UK GDPR) - to improve performance and user experience.

### 5.4 Data We Do NOT Collect
- ❌ Browsing history
- ❌ Passwords (stored locally or transmitted)
- ❌ Content from non-academic websites
- ❌ IP addresses (these are only seen by the backend, not the Extension)
- ❌ Device fingerprints
- ❌ Location data
- ❌ Analytics or telemetry data
- ❌ Keystroke or mouse tracking

## 6. How We Use Your Personal Data

### 6.1 Service Delivery
- Authenticating you with the Ref-Lex backend
- Displaying your projects and categories in the Extension UI
- Extracting bibliographic metadata from academic paper pages
- Sending paper metadata to the Ref-Lex backend when you add a reference
- Caching data locally to reduce server load and improve performance

### 6.2 Security
- Verifying your login session with the backend
- Protecting API requests with CSRF tokens
- Enforcing rate limits (received from backend)

### 6.3 No Other Uses
We **DO NOT**:
- Use your data for marketing or advertising
- Profile you or make automated decisions
- Share your data with third parties (except the Ref-Lex backend)
- Sell your data

## 7. How We Share Your Personal Data

### 7.1 With the Ref-Lex Backend
The Extension communicates exclusively with the Ref-Lex backend API (https://ref-lex.site). Data sent to the backend includes:

**On authentication:**
- Your login credentials (when you click "Login" - the Extension opens the backend login page)
- Authentication cookie (read from your browser and included in API requests)

**When adding a reference:**
- Paper metadata (title, authors, DOI, BibTeX, etc.)
- Project ID (which project to add the reference to)
- Category name (if you assign one)
- Your annotations (comments, ratings, notes)

All data sent to the backend is governed by the [Ref-Lex Web Application Privacy Policy](https://github.com/MShields1986/Ref-Lex/blob/main/PRIVACY_POLICY.md).

### 7.2 External BibTeX APIs
The Extension may fetch BibTeX data from:
- **https://doi.org/***: CrossRef DOI resolver (sends DOI only)
- **https://arxiv.org/bibtex/***: ArXiv BibTeX API (sends ArXiv ID only)

These requests are made directly from your browser and do not go through our servers. These services may log your IP address according to their own privacy policies.

### 7.3 No Other Third Parties
We **DO NOT** share data with:
- Advertisers or marketing companies
- Analytics services (Google Analytics, etc.)
- Social media platforms
- Data brokers
- Any other third parties

## 8. Data Storage and Retention

### 8.1 Local Storage (Browser Storage API)
Data is stored locally in your browser using the `browser.storage.local` API:

**Persistent data:**
- Authentication state
- User information (cached)
- API base URL
- Default project ID

**Temporary data (cleared on browser restart or sidebar close):**
- Cached projects (5-minute TTL)
- Cached categories (5-minute TTL)
- Last detected paper
- CSRF token

### 8.2 Server Storage
Data sent to the Ref-Lex backend is stored according to the [Ref-Lex Web Application Privacy Policy](https://github.com/MShields1986/Ref-Lex/blob/main/PRIVACY_POLICY.md).

### 8.3 Data Retention
- **Local Extension data**: Retained until you uninstall the Extension or clear browser data
- **Backend data**: Retained as described in the Web Application Privacy Policy

### 8.4 Deleting Your Data
To delete data stored by the Extension:
- **Uninstall the Extension**: Removes all local Extension data
- **Clear browser storage**: Browser settings → Privacy → Clear browsing data → Cookies and site data
- **Logout**: Clears cached user data and authentication state
- **Delete your account**: See the Web Application Privacy Policy for backend data deletion

## 9. Data Security

### 9.1 Technical Measures
- **HTTPS only**: All API communication uses HTTPS encryption
- **httpOnly cookies**: Authentication cookies cannot be accessed by JavaScript (XSS protection)
- **CSRF protection**: All API requests include CSRF tokens
- **Content Security Policy**: Strict CSP prevents code injection
- **No inline scripts**: All JavaScript is in separate files (prevents XSS)
- **Input validation**: All user inputs are validated before sending to backend
- **Parameterized requests**: All API requests use structured formats (prevents injection)

### 9.2 Extension Store Security
- **Manifest V3**: Uses the latest, most secure browser extension standard
- **Minimal permissions**: We only request permissions necessary for functionality
- **Code review**: All code is publicly available on GitHub for transparency
- **No obfuscation**: All code is readable and auditable

### 9.3 No Guarantee
While we implement industry-standard security measures, no system is 100% secure. We cannot guarantee absolute security.

## 10. Your Rights Under UK GDPR

You have the same rights as described in the [Ref-Lex Web Application Privacy Policy](https://github.com/MShields1986/Ref-Lex/blob/main/PRIVACY_POLICY.md), including:

- **Right of Access** (Article 15): Request a copy of data stored by the Extension
- **Right to Rectification** (Article 16): Correct inaccurate data
- **Right to Erasure** (Article 17): Delete your data by uninstalling the Extension or deleting your account
- **Right to Restriction** (Article 18): Request limited processing
- **Right to Data Portability** (Article 20): Export your references from the backend
- **Right to Object** (Article 21): Object to processing
- **Right to Lodge a Complaint**: Contact the UK ICO

**How to exercise your rights:**
- Contact us at the-librarian@ref-lex.site
- For backend data rights, see the Web Application Privacy Policy

## 11. Cookies

### 11.1 Cookies the Extension Reads
The Extension reads the following cookie set by ref-lex.site:

- **`access_token_cookie`**:
  - **Purpose**: JWT authentication token
  - **Set by**: Ref-Lex backend (ref-lex.site)
  - **Duration**: 7 days of inactivity
  - **Type**: httpOnly, Secure, SameSite
  - **Used for**: Authenticating API requests to the backend

### 11.2 Cookies the Extension Does NOT Use
- ❌ Analytics cookies
- ❌ Advertising cookies
- ❌ Social media cookies
- ❌ Third-party tracking cookies

### 11.3 Cookie Consent
The authentication cookie is strictly necessary for the Extension to function. Under UK GDPR and PECR, we do not require explicit consent for strictly necessary cookies.

## 12. Children's Privacy

The Extension is not intended for children under 13. We do not knowingly collect personal data from children under 13.

If you are between 13 and 18, you should obtain parental consent before using the Extension.

## 13. International Data Transfers

### 13.1 Data Storage
- **Local data**: Stored on your device in your country
- **Backend data**: Stored in the United Kingdom (see Web Application Privacy Policy)

### 13.2 External API Calls
When fetching BibTeX from DOI or ArXiv:
- Requests are made directly from your browser
- Your IP address may be visible to these services
- These services have their own privacy policies

## 14. No Tracking or Analytics

We **DO NOT** use:
- Google Analytics or similar services
- Error tracking services (Sentry, Bugsnag, etc.)
- Usage analytics or telemetry
- A/B testing or feature flags
- Heatmaps or session recording
- Fingerprinting or device tracking

The Extension operates entirely offline except for:
- Authentication with ref-lex.site
- API requests to ref-lex.site when you add references
- BibTeX fetching from DOI/ArXiv when available

## 15. Open Source and Transparency

The Extension is **open source** under the MIT License:
- **Source code**: https://github.com/MShields1986/Ref-Lex-WebExtension
- **License**: MIT (see LICENSE file)
- **Auditable**: Anyone can review the code to verify our privacy claims

We encourage security researchers and privacy advocates to audit our code.

## 16. Changes to This Privacy Policy

We may update this Privacy Policy to reflect:
- Changes in Extension functionality
- Legal requirements
- User feedback

When we make material changes:
- We will update the "Last Updated" date
- We will notify users via the Extension update notes
- Major changes will be highlighted in the Chrome Web Store listing

Your continued use after updates constitutes acceptance of the revised policy.

## 17. Chrome Web Store Compliance

This Extension complies with the [Chrome Web Store Developer Program Policies](https://developer.chrome.com/docs/webstore/program-policies/), including:

- **Limited Use Disclosure**: We only use data from web pages to extract academic paper metadata for the reference management service
- **User Data Privacy**: We do not sell user data or use it for advertising
- **Secure Transmission**: All data transmitted to ref-lex.site uses HTTPS
- **Prominent Disclosure**: This Privacy Policy clearly explains all data collection and use

## 18. Firefox Add-ons Compliance

This Extension complies with [Firefox Add-on Policies](https://extensionworkshop.com/documentation/publish/add-on-policies/), including:

- **Data Disclosure**: All data collection is disclosed in this Privacy Policy
- **No Surprises**: The Extension does exactly what it describes
- **Security**: Code is auditable and follows Mozilla security guidelines

## 19. Contact Us

For questions about this Privacy Policy or the Extension's data practices:

**Email**: the-librarian@ref-lex.site

**Source Code**: https://github.com/MShields1986/Ref-Lex-WebExtension

**Issues**: https://github.com/MShields1986/Ref-Lex-WebExtension/issues

We aim to respond within 5 business days.

## 20. Supervisory Authority

You have the right to lodge a complaint with the UK Information Commissioner's Office (ICO):

**Information Commissioner's Office (ICO)**
- Website: https://ico.org.uk/
- Email: casework@ico.org.uk
- Phone: 0303 123 1113
- Address: Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF

---

**By installing and using the Ref-Lex Browser Extension, you acknowledge that you have read and understood this Privacy Policy and consent to the collection and use of your personal data as described herein.**

**For data processing by the Ref-Lex backend service, please also review the [Ref-Lex Web Application Privacy Policy](https://github.com/MShields1986/Ref-Lex/blob/main/PRIVACY_POLICY.md).**
