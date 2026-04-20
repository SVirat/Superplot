export default function Privacy() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <p className="legal-updated"><strong>Last Updated: April 20, 2026</strong></p>

        <h2>Introduction</h2>
        <p>Superplot ("we", "our", "us") is a private property management application. We are committed to protecting your privacy and being transparent about how we handle your data. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data.</p>

        <h2>Information We Collect</h2>

        <h3>Account Information</h3>
        <p>When you sign in with Google, we receive and store:</p>
        <ul>
          <li>Your name and email address</li>
          <li>Your Google profile picture URL</li>
          <li>A unique user identifier</li>
        </ul>

        <h3>Property Data</h3>
        <p>You may voluntarily provide:</p>
        <ul>
          <li>Property names, addresses, and locations</li>
          <li>Ownership and rental details (rent amounts, tenant contact info)</li>
          <li>Purchase prices and current valuations</li>
          <li>Property sizes and related metadata</li>
        </ul>

        <h3>Documents</h3>
        <ul>
          <li>Documents you upload are stored directly in <strong>your own Google Drive</strong> account, inside a folder called "PropertyVault"</li>
          <li>We store only the Google Drive file ID and a link to the file — <strong>we do not store your actual documents on our servers</strong></li>
        </ul>

        <h3>Authentication Tokens</h3>
        <ul>
          <li>We store OAuth tokens (access and refresh tokens) issued by Google to interact with your Google Drive on your behalf</li>
          <li>These tokens are stored securely in our database and are used solely to manage files in your Google Drive</li>
        </ul>

        <h3>AI API Keys (BYOK)</h3>
        <ul>
          <li>If you choose to provide your own AI API key (Bring Your Own Key), it is stored in our database associated with your account</li>
          <li>Your key is used only for processing your requests and is never shared with other users</li>
          <li>You can view a masked version of your key, replace it, or delete it at any time from Settings</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>We use your information exclusively to:</p>
        <ul>
          <li>Authenticate your identity via Google Sign-In</li>
          <li>Display and manage your property portfolio within the app</li>
          <li>Upload, organize, and retrieve documents from your Google Drive</li>
          <li>Provide search functionality across your properties</li>
          <li><strong>AI features</strong>: Extract text from uploaded documents, generate embeddings for semantic search, and answer your questions about your documents and portfolio</li>
          <li><strong>AI processing</strong>: Document text is chunked and stored as embeddings in our database for retrieval-augmented generation (RAG)</li>
        </ul>
        <p>We do <strong>not</strong>:</p>
        <ul>
          <li>Sell, rent, or share your personal data with third parties</li>
          <li>Use your data for advertising or marketing purposes</li>
          <li>Access any Google Drive files outside the "PropertyVault" folder</li>
          <li>Train AI models on your data</li>
          <li>Share your document content or AI queries with other users</li>
        </ul>

        <h2>Data Storage &amp; Security</h2>
        <ul>
          <li><strong>Database</strong>: Your account and property data is stored in a Supabase PostgreSQL database with Row Level Security (RLS) enabled — each user can only access their own data</li>
          <li><strong>Documents</strong>: Stored in your personal Google Drive, not on our servers</li>
          <li><strong>Encryption</strong>: All data is transmitted over HTTPS/TLS</li>
          <li><strong>Access Control</strong>: Authentication is handled by Supabase Auth with Google OAuth 2.0</li>
        </ul>

        <h2>Google API Usage</h2>
        <p>We request the following Google OAuth scopes:</p>
        <ul>
          <li><strong><code>email</code> and <code>profile</code></strong>: To identify you and display your name/avatar</li>
          <li><strong><code>drive.file</code></strong>: To create and manage files <strong>only</strong> within the PropertyVault folder in your Google Drive — we cannot access any other files in your Drive</li>
        </ul>
        <p>Our use of Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>

        <h2>Data Retention</h2>
        <ul>
          <li>Your data is retained as long as you maintain an active account</li>
          <li>You may delete individual properties and documents at any time through the app</li>
          <li>Documents deleted through the app are also removed from your Google Drive</li>
        </ul>

        <h2>Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li><strong>Access</strong>: View all data we hold about you through the app</li>
          <li><strong>Delete</strong>: Remove your properties, documents, and account data</li>
          <li><strong>Revoke Access</strong>: Revoke our Google Drive access at any time via your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">Google Account Permissions</a></li>
          <li><strong>Export</strong>: Your documents are already in your Google Drive and fully accessible to you</li>
        </ul>

        <h2>Third-Party Services</h2>
        <p>We use the following third-party services:</p>
        <table className="legal-table">
          <thead>
            <tr><th>Service</th><th>Purpose</th></tr>
          </thead>
          <tbody>
            <tr><td><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google</a></td><td>Authentication &amp; Drive storage</td></tr>
            <tr><td><a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Supabase</a></td><td>Database &amp; authentication</td></tr>
            <tr><td><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel</a></td><td>Application hosting</td></tr>
            <tr><td><a href="https://ai.google.dev/terms" target="_blank" rel="noopener noreferrer">Google AI (Gemini)</a></td><td>AI chat, embeddings, document OCR</td></tr>
            <tr><td><a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer">OpenAI</a></td><td>AI fallback provider</td></tr>
            <tr><td><a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer">Anthropic</a></td><td>AI fallback provider</td></tr>
            <tr><td><a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer">Razorpay</a></td><td>Payment processing</td></tr>
          </tbody>
        </table>

        <h3>AI Data Processing</h3>
        <ul>
          <li>When you use AI features, your document text and questions are sent to the configured AI provider (Gemini, OpenAI, or Anthropic) for processing</li>
          <li>If you use BYOK, your data is sent to the provider associated with your key</li>
          <li>AI providers may have their own data retention policies — refer to their privacy policies above</li>
          <li>We do not send your data to AI providers unless you actively use AI features</li>
        </ul>

        <h2>Children's Privacy</h2>
        <p>This service is not directed to individuals under the age of 13. We do not knowingly collect personal information from children.</p>

        <h2>Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify users of material changes by updating the "Last Updated" date at the top of this page.</p>

        <hr />
        <p className="legal-footer-note"><em>This privacy policy applies to the Superplot application hosted at superplot.vercel.app.</em></p>
      </div>
    </div>
  );
}
