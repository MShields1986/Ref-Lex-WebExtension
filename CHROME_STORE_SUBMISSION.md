# Chrome Web Store Submission Checklist

This document provides a step-by-step checklist for submitting the Ref-Lex Browser Extension to the Chrome Web Store.

## Pre-Submission Requirements

### ✅ 1. Developer Account Setup
- [ ] Create a [Chrome Web Store Developer Account](https://chrome.google.com/webstore/devconsole/)
- [ ] Pay the one-time $5 developer registration fee
- [ ] Verify your email address
- [ ] Set up payment information (if planning paid features)

### ✅ 2. Extension Package
- [ ] Build the production version: `npm run build:chrome`
- [ ] Verify all files are in `dist/` folder
- [ ] Check manifest.json is present in dist/
- [ ] Verify all icons exist: dist/assets/icons/icon-16.png, icon-48.png, icon-128.png
- [ ] Test the extension by loading unpacked from `dist/` in Chrome
- [ ] Create a ZIP file of the `dist/` folder (NOT a folder containing dist/)

### ✅ 3. Visual Assets

#### **Screenshots (REQUIRED - at least 1)**
- [ ] Create 1280x800 or 640x400 screenshots
- [ ] Screenshot 1: Extension sidebar with paper detected (login view)
- [ ] Screenshot 2: Extension showing detected paper with metadata
- [ ] Screenshot 3: Extension UI with projects and categories
- [ ] Screenshot 4: Extension adding a reference successfully
- [ ] Save as PNG or JPEG

**Tips for screenshots:**
- Show the extension in use on a real academic paper page
- Highlight key features (paper detection, project selection, adding references)
- Use high-quality, clear images
- Avoid small text or cluttered UI

#### **Promotional Images (OPTIONAL but recommended)**
- [ ] Small tile: 440x280 PNG (shown in search results)
- [ ] Marquee tile: 1400x560 PNG (shown on extension detail page)

**Design tips:**
- Use Ref-Lex branding colors (from your icons)
- Include extension name and tagline
- Keep it simple and professional

### ✅ 4. Store Listing Information

#### **Basic Information**
- [ ] **Extension Name**: "Ref-Lex" (max 45 characters)
- [ ] **Summary**: "Quickly add academic papers to your Ref-Lex projects from any website" (max 132 characters)
- [ ] **Description**: See template below (max 16,000 characters)
- [ ] **Category**: Productivity
- [ ] **Language**: English (UK) or English (US)

#### **Store Listing Description Template**

```
Ref-Lex Browser Extension - Academic Reference Management Made Easy

Quickly save academic papers to your Ref-Lex reference manager directly from your browser. Detect and extract bibliographic metadata from major academic publishers with a single click.

✨ KEY FEATURES

• Quick Paper Capture: Automatically detect and extract metadata from academic websites
• Multi-Site Support: Works with ArXiv, Google Scholar, PubMed, IEEE, ACM, Springer, ScienceDirect, JSTOR, and more
• Project Integration: Add references directly to your Ref-Lex projects
• Category Organization: Assign categories to organize your references
• Notes & Annotations: Add custom comments, ratings, and notes when saving papers
• Seamless Workflow: Sidebar interface doesn't interrupt your browsing

🎓 SUPPORTED ACADEMIC SITES

• ArXiv.org - Preprints and research papers
• Google Scholar - Academic search results
• PubMed - Biomedical and life sciences literature
• IEEE Xplore - Engineering and technology papers
• ACM Digital Library - Computer science publications
• SpringerLink - Scientific journals and books
• ScienceDirect - Elsevier journals and articles
• JSTOR - Academic journals and primary sources
• Generic DOI support - Any website with DOI metadata

📚 HOW IT WORKS

1. Install the extension and log in with your Ref-Lex account
2. Navigate to any academic paper page
3. Click the extension icon - metadata is detected automatically
4. Select which project to add the paper to
5. Optionally assign a category or add notes
6. Click "Add to Ref-Lex" - done!

🔒 PRIVACY & SECURITY

Your privacy is important to us:
• No tracking or analytics
• No ads or third-party data sharing
• Data only sent to YOUR Ref-Lex account
• Open source for full transparency
• Full privacy policy: https://github.com/MShields1986/Ref-Lex-WebExtension/blob/main/PRIVACY_POLICY.md

This extension only accesses academic paper metadata when you explicitly open it. It does not track your browsing or collect data from non-academic websites.

🌐 ABOUT REF-LEX

Ref-Lex is an open-source academic reference manager designed for researchers, students, and academics. Manage your bibliographic references, organize projects, collaborate with others, and export to BibTeX.

Learn more: https://ref-lex.site

📖 OPEN SOURCE

This extension is open source under the MIT License:
• Source code: https://github.com/MShields1986/Ref-Lex-WebExtension
• Report issues: https://github.com/MShields1986/Ref-Lex-WebExtension/issues
• Contribute: Pull requests welcome!

💬 SUPPORT

Need help? Contact us at the-librarian@ref-lex.site

🆓 FREE TO USE

This extension is completely free with no ads, no tracking, and no premium features. Requires a free Ref-Lex account (sign up at https://ref-lex.site).

---

Note: This extension requires the Ref-Lex web application. Visit https://ref-lex.site to create a free account.
```

### ✅ 5. Privacy Information

#### **Privacy Policy URL** (REQUIRED)
- [ ] Host privacy policy at a publicly accessible URL
- [ ] **Recommended**: Use GitHub Pages or your website
- [ ] **URL**: `https://raw.githubusercontent.com/MShields1986/Ref-Lex-WebExtension/main/PRIVACY_POLICY.md`
  - OR: `https://ref-lex.site/extension-privacy` (if you host it on your website)
  - OR: `https://mshields1986.github.io/Ref-Lex-WebExtension/PRIVACY_POLICY.html` (if using GitHub Pages)

**Best Practice**: Host on your own domain (ref-lex.site/extension-privacy) for professionalism

#### **Privacy Practices Declaration**
Use the information from `CHROME_STORE_PRIVACY.md` to fill out:

- [ ] **Single Purpose**: "Allows users to save academic papers to their Ref-Lex reference manager by extracting bibliographic metadata from academic websites"
- [ ] **Permission Justifications**: Copy from CHROME_STORE_PRIVACY.md
- [ ] **Data Collection**: Check applicable boxes and provide explanations
- [ ] **Certification**: Certify compliance with Limited Use requirements

### ✅ 6. Contact & Support

- [ ] **Official Website**: https://ref-lex.site
- [ ] **Support Email**: the-librarian@ref-lex.site
- [ ] **Support URL** (optional): https://github.com/MShields1986/Ref-Lex-WebExtension/issues

### ✅ 7. Testing & Quality

- [ ] Test extension in Chrome (latest version)
- [ ] Test on multiple academic sites (ArXiv, Google Scholar, PubMed, etc.)
- [ ] Test login/logout flow
- [ ] Test adding references to different projects
- [ ] Test with no internet connection (should show appropriate error)
- [ ] Test with invalid credentials
- [ ] Verify no console errors in normal usage
- [ ] Check all UI elements are properly styled
- [ ] Verify sidebar opens correctly

### ✅ 8. Legal & Compliance

- [ ] Confirm extension doesn't violate [Chrome Web Store Program Policies](https://developer.chrome.com/docs/webstore/program-policies/)
- [ ] Verify no copyrighted content without permission
- [ ] Confirm no misleading functionality
- [ ] Ensure compliance with GDPR/UK GDPR (already done - see PRIVACY_POLICY.md)

## Submission Process

### Step 1: Upload Extension
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Click "New Item"
3. Upload your ZIP file (the contents of `dist/` folder)
4. Wait for upload to complete

### Step 2: Fill Out Store Listing

#### **Product Details**
- **Name**: Ref-Lex
- **Summary**: Quickly add academic papers to your Ref-Lex projects from any website
- **Description**: Use the template above
- **Category**: Productivity
- **Language**: English (UK)

#### **Graphic Assets**
- Upload screenshots (at least 1, recommended 3-5)
- Upload small promotional tile (440x280 - optional but recommended)
- Upload marquee tile (1400x560 - optional)
- Extension icon (automatically pulled from manifest)

#### **Additional Fields**
- **Official URL**: https://ref-lex.site
- **Homepage URL**: https://github.com/MShields1986/Ref-Lex-WebExtension
- **Support URL**: https://github.com/MShields1986/Ref-Lex-WebExtension/issues

### Step 3: Privacy

#### **Privacy Policy**
- Paste privacy policy URL: `https://ref-lex.site/extension-privacy` or GitHub URL
- Must be publicly accessible without login

#### **Permissions Justification**
For each permission, provide clear justification (see CHROME_STORE_PRIVACY.md):
- **activeTab**: [Copy justification from CHROME_STORE_PRIVACY.md]
- **storage**: [Copy justification]
- **cookies**: [Copy justification]
- **sidePanel**: [Copy justification]
- **host_permissions (<all_urls>)**: [Copy justification - emphasize academic use only]

#### **Data Usage**
Answer all questions about data collection using CHROME_STORE_PRIVACY.md:
- What data is collected? → Check boxes and explain (user account, auth tokens, paper metadata)
- How is it used? → Service functionality and performance
- Is it shared? → Only with Ref-Lex backend and DOI/ArXiv APIs
- Certify Limited Use compliance

### Step 4: Distribution

#### **Visibility**
- [x] **Public** (visible to everyone in Chrome Web Store)
- [ ] Unlisted (only accessible via direct link)
- [ ] Private (only to specific Google accounts/groups)

**Recommended**: Public

#### **Regions**
- [x] All regions (recommended)
- [ ] Specific countries only

#### **Pricing**
- [x] Free
- [ ] Paid (requires payment setup)

### Step 5: Submit for Review

1. Review all information for accuracy
2. Click "Submit for Review"
3. Wait for review (typically 1-3 days, can be up to 1-2 weeks)

## After Submission

### During Review
- [ ] Monitor your email for review status updates
- [ ] Check Developer Dashboard for review status
- [ ] Be prepared to respond to review feedback within 7 days

### If Approved ✅
- [ ] Extension will be published to the Chrome Web Store
- [ ] Users can install it from the store
- [ ] You'll receive a confirmation email
- [ ] Add Chrome Web Store badge to your README:
  ```markdown
  [![Chrome Web Store](https://img.shields.io/chrome-web-store/v/YOUR_EXTENSION_ID.svg)](https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID)
  ```

### If Rejected ❌
Common rejection reasons and fixes:

**1. Privacy Policy Issues**
- Ensure privacy policy URL is publicly accessible
- Privacy policy must cover all data collection
- Fix: Update PRIVACY_POLICY.md and re-host

**2. Permission Justification Insufficient**
- Provide more detailed explanations
- Fix: Use the detailed justifications from CHROME_STORE_PRIVACY.md

**3. `<all_urls>` Permission Too Broad**
- Reviewers may question the need for all_urls
- Fix: Provide strong justification (academic sites on various domains, DOI fetching)
- Alternative: Limit to specific domains (see previous review recommendations)

**4. Functionality Not Clear**
- Add better screenshots showing the extension in action
- Improve description to clarify purpose

**5. Broken Functionality**
- Test thoroughly before resubmitting
- Ensure Ref-Lex backend is live and accessible

**To Appeal/Resubmit:**
1. Address the issues mentioned in rejection email
2. Reply to the review team explaining changes
3. Submit updated version if needed

## Post-Launch

### Marketing & Promotion
- [ ] Announce on Ref-Lex website
- [ ] Add "Install Extension" button to ref-lex.site
- [ ] Share on social media / academic communities
- [ ] Add Chrome Web Store link to GitHub README
- [ ] Consider Firefox Add-ons submission

### Maintenance
- [ ] Monitor user reviews and ratings
- [ ] Respond to user feedback
- [ ] Fix bugs reported by users
- [ ] Submit updates when needed (manifest changes require re-review)

### Analytics & Monitoring
- [ ] Check Chrome Web Store stats (installs, uninstalls)
- [ ] Monitor GitHub issues for bug reports
- [ ] Track user feedback via email

## Useful Links

- **Chrome Web Store Developer Dashboard**: https://chrome.google.com/webstore/devconsole/
- **Program Policies**: https://developer.chrome.com/docs/webstore/program-policies/
- **Review Process**: https://developer.chrome.com/docs/webstore/review-process/
- **User Data Policy**: https://developer.chrome.com/docs/webstore/program-policies/#userdata
- **Best Practices**: https://developer.chrome.com/docs/webstore/best-practices/

## Quick Reference: Required Fields Summary

| Field | Value |
|-------|-------|
| Extension Name | Ref-Lex |
| Summary | Quickly add academic papers to your Ref-Lex projects from any website |
| Category | Productivity |
| Privacy Policy URL | https://ref-lex.site/extension-privacy OR GitHub URL |
| Official Website | https://ref-lex.site |
| Support Email | the-librarian@ref-lex.site |
| Minimum Screenshots | 1 (recommended: 3-5) |
| Screenshot Size | 1280x800 or 640x400 |
| Small Tile | 440x280 (optional but recommended) |
| Language | English (UK) |
| Pricing | Free |

## Estimated Timeline

- **Preparation**: 1-2 hours (screenshots, privacy policy hosting)
- **Submission**: 30 minutes (filling out forms)
- **Review**: 1-3 days (typical), up to 2 weeks (if flagged)
- **Total**: ~3-5 days from submission to publication

Good luck with your submission! 🚀
