# Ref-Lex Web Extension

[![CI](https://github.com/MShields1986/Ref-Lex-WebExtension/workflows/CI/badge.svg)](https://github.com/MShields1986/Ref-Lex-WebExtension/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/github/v/release/MShields1986/Ref-Lex-WebExtension)](https://github.com/MShields1986/Ref-Lex-WebExtension/releases)
<!-- [![codecov](https://codecov.io/gh/MShields1986/Ref-Lex-WebExtension/branch/main/graph/badge.svg)](https://codecov.io/gh/MShields1986/Ref-Lex-WebExtension) -->

Browser extension for [Ref-Lex](https://ref-lex.site) - quickly add academic papers from any website to your Ref-Lex projects.

## Features

- **Quick Paper Capture**: Detect and extract academic paper metadata from supported sites
- **Project Integration**: Add references directly to your Ref-Lex projects
- **Category Assignment**: Organize references with categories
- **Notes & Comments**: Add custom comments when saving papers
- **Multi-Site Support**: Works with ArXiv, Google Scholar, PubMed, IEEE, ACM, and more

## Supported Academic Sites

- ArXiv.org
- Google Scholar
- PubMed
- IEEE Xplore
- ACM Digital Library
- SpringerLink
- ScienceDirect
- JSTOR
- Generic sites with DOI/metadata

## Installation

**Chrome/Edge:**
1. Download the latest release from [Releases](../../releases)
2. Unzip the file
3. Open `chrome://extensions`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the unzipped folder

**Firefox:**
1. Download the latest `.xpi` file from [Releases](../../releases)
2. Open `about:addons`
3. Click the gear icon → "Install Add-on From File"
4. Select the downloaded `.xpi` file

## Usage

1. **Login**: Click the extension icon and login with your Ref-Lex credentials
2. **Browse**: Navigate to any academic paper page
3. **Capture**: Click the extension icon - paper metadata will be detected automatically
4. **Select Project**: Choose which Ref-Lex project to add the paper to
5. **Add Category** (optional): Assign a category
6. **Add Notes** (optional): Write custom comments or annotations
7. **Save**: Click "Add to Ref-Lex" to save the reference

## Privacy & Permissions

This extension requires the following permissions:

- **activeTab**: To detect paper metadata on the current page
- **storage**: To cache your login session and preferences
- **cookies**: To maintain authentication with the Ref-Lex backend
- **host_permissions**: To fetch BibTeX from external sources (CrossRef, ArXiv API, etc.)

**We respect your privacy:**
- ✅ No tracking or analytics
- ✅ No data collection beyond what's necessary for functionality
- ✅ No ads or third-party data sharing
- ✅ Open source code for full transparency

Read our full [Privacy Policy](PRIVACY_POLICY.md) for detailed information.

## Browser Compatibility

- Chrome/Chromium 109+
- Firefox 109+
- Edge (Chromium-based) 109+
- Safari (requires conversion with Xcode)

## Support

For issues and feature requests, please visit the [issue tracker](../../issues).
