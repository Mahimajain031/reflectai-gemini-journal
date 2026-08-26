# Gemini Journal & Reflections (ReflectAI)

A secure, private, user-authenticated journaling and reflection assistant powered by **Gemini 3.6 Flash**, **Cloud Firestore**, and **Firebase Authentication** with strict user-data isolation.

---

## 1. Agentic Threat Model & Countermeasures

| Threat Zone | Identified Risk | Countermeasures & Implementation |
| :--- | :--- | :--- |
| **Input Surfaces** | Malicious injection in journal prompt, XSS payloads, or excessively large text payloads. | Strict input length validation on client and server (capped at 20,000 chars); sanitize and encode outputs before rendering; reject malformed payloads. |
| **Planning & Reasoning** | Prompt injection attempting to alter assistant personality or exfiltrate system instructions. | Explicit system instructions framing entries strictly as text to be reflected upon/summarized; isolated data context; multi-turn role structuring. |
| **Tool & API Execution** | API key leakage, rate limiting, or backend downtime during Gemini calls. | Server-side API proxying (`process.env.GEMINI_API_KEY` never sent to client); Gemini Resilient Fallback Protocol (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`). |
| **Memory & State** | Cross-user data leakage, unauthenticated document manipulation, orphaned writes. | Owner-bound Firestore path security (`/users/{userId}/interactions/{interactionId}`); strict rules enforcing `request.auth.uid == userId`; client and server undefined-stripping; transaction verification. |
| **Inter-System Communication** | Insecure token transmission or credential harvesting. | Federated Google Sign-In via Firebase Auth; token verification; zero hardcoded credentials; Google Secret Manager / `.env.example` hygiene. |

---

## 2. Architecture & Security Standard

- **Frontend**: React 19 + Tailwind CSS + Lucide Icons + React Markdown.
- **Backend API**: Express server running on Node.js / Cloud Run proxying Gemini API requests.
- **Database**: Cloud Firestore with owner-isolated subcollections (`/users/{userId}/interactions/{interactionId}`).
- **Authentication**: Firebase Authentication with Federated Google Sign-In (no custom password storage).
- **AI Processing Engine**: Gemini 3.6 Flash with automated fallback ladder across `gemini-3.6-flash`, `gemini-3.1-flash-lite`, `gemini-flash-latest`, and `gemini-3.7-flash`.

---

## 3. Firestore Security Rules

Deploy the following owner-bound rules in `firestore.rules` to strictly isolate user data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy using the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Google Cloud Secret Manager Configuration

Never commit API keys or credentials to version control. Set up Secret Manager bindings for your Cloud Run service:

```bash
# 1. Enable required Google Cloud services
gcloud services enable run.googleapis.com secretmanager.googleapis.com firestore.googleapis.com

# 2. Create the GEMINI_API_KEY secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 3. Add the secret payload
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 4. Grant your Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 5. Google Cloud Run Deployment & Campaign Verification

### Deploy to Cloud Run

```bash
# Build and deploy the containerized service
gcloud run deploy gemini-journal-reflections \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

### Apply Required Campaign Verification Label

```bash
# Apply the mandatory resource label to register the service for automated challenge verification
gcloud run services update gemini-journal-reflections \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 6. Functional Stability & Walkthrough Manual Test Suite

Every user-facing interaction and workflow has been tested and verified:

### Test Case 1: Unauthenticated Landing & Google Sign-In
1. Navigate to the root URL `/`.
2. Verify that the landing page displays the title *"Your Private Space for Thoughts, Synthesis & Clarity"* with the feature cards (Gemini 3.6 Flash, Owner-Bound Firestore, Multi-Turn Reflections, Secret Hygiene).
3. Click **"Continue with Google Sign-In"**.
4. Confirm the Google OAuth popup opens and authenticates the user.
5. Confirm the UI transitions immediately to the authenticated private Dashboard with the user's avatar and email.

### Test Case 2: Daily Reflection Generation (Single-Turn)
1. On the composer screen, select the **"Daily Reflection"** mode card.
2. In the textarea, type a journal entry: *"Today I managed a difficult product deadline and felt overwhelmed, but our team pulled through."*
3. Click **"Reflect with Gemini"**.
4. Confirm the loading state with spinning indicator appears.
5. Verify that Gemini 3.6 Flash returns a structured Markdown reflection containing:
   - Mindful Reflection
   - Key Insights & Philosophical Perspective
   - Exploratory Inquiries
6. Confirm the entry is automatically saved to Cloud Firestore under `/users/<uid>/interactions/<docId>` and the entries count increments.

### Test Case 3: Mode Switching (Executive Summary & Action Steps)
1. Click **"Start New Reflection"**.
2. Select **"Summary & Takeaways"** mode.
3. Paste meeting notes or rough thoughts.
4. Click **"Reflect with Gemini"**.
5. Verify that Gemini formats the response with an Executive Summary and bulleted Actionable Takeaways.
6. Verify the mode badge displays `Summary` and the model tag `gemini-3.6-flash`.

### Test Case 4: Multi-Turn Dialogue & Follow-Ups
1. With an active reflection loaded on screen, scroll to the bottom follow-up input.
2. Type: *"Can you suggest 3 micro-habits to prevent this deadline stress in the future?"*
3. Click **"Continue"**.
4. Confirm the conversation thread appends the user query and Gemini's follow-up advice while maintaining conversation context.
5. Confirm the updated thread is synced to Firestore.

### Test Case 5: History Viewer, Search & Filtering
1. Click the **"Entries"** tab in the top navigation bar.
2. Verify that all saved reflections appear in the grid with title, date, turn count, and mode badges.
3. In the search input, type a keyword from one of your entries (e.g., *"deadline"*).
4. Verify the list filters in real time.
5. Switch the Mode filter dropdown to *"Daily Reflection"*.
6. Click the star icon to favorite an entry, then toggle the **"Favorites"** filter to view only starred entries.

### Test Case 6: Conversation Reload & Tag Management
1. Click any card in the History list.
2. Verify the full multi-turn conversation opens in the active editor.
3. Click **"+ Add Tag"**, type `work`, and press Add. Confirm the tag `#work` appears.
4. Click **"Copy"** to verify clipboard copy functionality.
5. Click **"Export"** to download the reflection as a `.md` Markdown file.

### Test Case 7: Strict User Isolation Verification
1. Click the **"Verify Rules"** dropdown in the Security Banner.
2. Confirm the exact active Firestore path `/users/{userId}/interactions/*` matching the user's authenticated UID.
3. Sign out and sign in with a different Google account: verify that User B cannot see User A's past entries.

### Test Case 8: Sign Out
1. Click **"Sign Out"** in the navigation bar.
2. Verify all session state is cleared and the user is returned to the public landing page.
