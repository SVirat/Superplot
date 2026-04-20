# Privacy Policy

**Last Updated: April 20, 2026**

## Introduction

Superplot ("we", "our", "us") is a private property management application. We are committed to protecting your privacy and being transparent about how we handle your data. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data.

## Information We Collect

### Account Information
When you sign in with Google, we receive and store:
- Your name and email address
- Your Google profile picture URL
- A unique user identifier

### Property Data
You may voluntarily provide:
- Property names, addresses, and locations
- Ownership and rental details (rent amounts, tenant contact info)
- Purchase prices and current valuations
- Property sizes and related metadata

### Documents
- Documents you upload are stored directly in **your own Google Drive** account, inside a folder called "PropertyVault"
- We store only the Google Drive file ID and a link to the file — **we do not store your actual documents on our servers**

### Authentication Tokens
- We store OAuth tokens (access and refresh tokens) issued by Google to interact with your Google Drive on your behalf
- These tokens are stored securely in our database and are used solely to manage files in your Google Drive

### AI API Keys (BYOK)
- If you choose to provide your own AI API key (Bring Your Own Key), it is stored in our database associated with your account
- Your key is used only for processing your requests and is never shared with other users
- You can view a masked version of your key, replace it, or delete it at any time from Settings

## How We Use Your Information

We use your information exclusively to:
- Authenticate your identity via Google Sign-In
- Display and manage your property portfolio within the app
- Upload, organize, and retrieve documents from your Google Drive
- Provide search functionality across your properties
- **AI features**: Extract text from uploaded documents, generate embeddings for semantic search, and answer your questions about your documents and portfolio
- **AI processing**: Document text is chunked and stored as embeddings in our database for retrieval-augmented generation (RAG)

We do **not**:
- Sell, rent, or share your personal data with third parties
- Use your data for advertising or marketing purposes
- Access any Google Drive files outside the "PropertyVault" folder
- Train AI models on your data
- Share your document content or AI queries with other users

## Data Storage & Security

- **Database**: Your account and property data is stored in a Supabase PostgreSQL database with Row Level Security (RLS) enabled — each user can only access their own data
- **Documents**: Stored in your personal Google Drive, not on our servers
- **Encryption**: All data is transmitted over HTTPS/TLS
- **Access Control**: Authentication is handled by Supabase Auth with Google OAuth 2.0

## Google API Usage

We request the following Google OAuth scopes:
- **`email` and `profile`**: To identify you and display your name/avatar
- **`drive.file`**: To create and manage files **only** within the PropertyVault folder in your Google Drive — we cannot access any other files in your Drive

Our use of Google APIs adheres to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.

## Data Retention

- Your data is retained as long as you maintain an active account
- You may delete individual properties and documents at any time through the app
- Documents deleted through the app are also removed from your Google Drive

## Your Rights

You have the right to:
- **Access**: View all data we hold about you through the app
- **Delete**: Remove your properties, documents, and account data
- **Revoke Access**: Revoke our Google Drive access at any time via your [Google Account Permissions](https://myaccount.google.com/permissions)
- **Export**: Your documents are already in your Google Drive and fully accessible to you

## Third-Party Services

We use the following third-party services:
| Service | Purpose | Privacy Policy |
|---------|---------|----------------|
| [Google](https://policies.google.com/privacy) | Authentication & Drive storage | Google Privacy Policy |
| [Supabase](https://supabase.com/privacy) | Database & authentication | Supabase Privacy Policy |
| [Vercel](https://vercel.com/legal/privacy-policy) | Application hosting | Vercel Privacy Policy |
| [Google AI (Gemini)](https://ai.google.dev/terms) | AI chat, embeddings, document OCR | Google AI Terms |
| [OpenAI](https://openai.com/privacy) | AI fallback provider | OpenAI Privacy Policy |
| [Anthropic](https://www.anthropic.com/privacy) | AI fallback provider | Anthropic Privacy Policy |
| [Razorpay](https://razorpay.com/privacy/) | Payment processing | Razorpay Privacy Policy |

### AI Data Processing
- When you use AI features, your document text and questions are sent to the configured AI provider (Gemini, OpenAI, or Anthropic) for processing
- If you use BYOK, your data is sent to the provider associated with your key
- AI providers may have their own data retention policies — refer to their privacy policies above
- We do not send your data to AI providers unless you actively use AI features

## Children's Privacy

This service is not directed to individuals under the age of 13. We do not knowingly collect personal information from children.

## Changes to This Policy

We may update this Privacy Policy from time to time. We will notify users of material changes by updating the "Last Updated" date at the top of this page.

---

*This privacy policy applies to the Superplot application hosted at superplot.vercel.app.*
