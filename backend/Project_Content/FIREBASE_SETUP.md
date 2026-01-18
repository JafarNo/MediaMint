# Firebase Setup Instructions for MediaMint

Follow these steps to set up Firebase for your MediaMint backend.

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** (or "Add project")
3. Enter project name: `MediaMint` (or your preferred name)
4. Click **Continue**
5. Disable Google Analytics (optional) or enable it if you want
6. Click **Create project**
7. Wait for the project to be created, then click **Continue**

---

## Step 2: Set Up Firestore Database

1. In the Firebase Console, click on **"Build"** in the left sidebar
2. Click on **"Firestore Database"**
3. Click **"Create database"**
4. Choose **"Start in test mode"** (for development) or **"Start in production mode"**
   - For test mode: allows read/write for 30 days without authentication
   - For production mode: you'll need to set up security rules
5. Select your preferred **Cloud Firestore location** (choose one close to your users)
6. Click **Enable**

---

## Step 3: Generate Service Account Key (for Python Backend)

1. In Firebase Console, click the **gear icon** ⚙️ next to "Project Overview"
2. Click **"Project settings"**
3. Go to the **"Service accounts"** tab
4. Click **"Generate new private key"**
5. Click **"Generate key"** in the confirmation dialog
6. A JSON file will be downloaded - **KEEP THIS FILE SECURE!**
7. Rename the downloaded file to `firebase-service-account.json`
8. Move it to your backend folder: `backend/Project_Content/ContentApp/firebase-service-account.json`

⚠️ **IMPORTANT SECURITY NOTE:**
- NEVER commit this file to Git!
- Add it to your `.gitignore` file
- Keep it secure and don't share it publicly

---

## Step 4: Get Firebase Configuration (Optional - for Frontend)

If you want to use Firebase directly from the React Native app later:

1. In Firebase Console, go to **Project settings**
2. Scroll down to **"Your apps"**
3. Click the **Web icon** `</>` to add a web app
4. Register app with nickname: `MediaMint-Web`
5. Copy the Firebase configuration object

---

## Step 5: Set Up Firestore Security Rules (Production)

Go to **Firestore Database** > **Rules** tab and set up rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read/write their own content
    match /generated_content/{contentId} {
      allow read, write: if request.auth != null && 
        resource.data.owner_id == request.auth.uid;
    }
    
    // For backend service account access (full access)
    match /{document=**} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```

For development/testing, you can use permissive rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

## Step 6: Firestore Collections Structure

The backend will create these collections automatically:

### `users` Collection
```
users/
  {user_id}/
    - email: string
    - username: string
    - first_name: string
    - last_name: string
    - hashed_password: string
    - is_active: boolean
    - role: string
    - phone_number: string
    - created_at: timestamp
```

### `refresh_tokens` Collection
```
refresh_tokens/
  {token_id}/
    - user_id: string
    - token: string
    - created_at: timestamp
    - expires_at: timestamp
    - revoked: boolean
```

### `password_reset_tokens` Collection
```
password_reset_tokens/
  {token_id}/
    - email: string
    - token: string
    - created_at: timestamp
    - expires_at: timestamp
    - used: boolean
```

### `generated_content` Collection
```
generated_content/
  {content_id}/
    - type: string ('text', 'image', 'video', 'audio')
    - prompt: string
    - result_text: string (optional)
    - file_url: string (optional)
    - owner_id: string
    - created_at: timestamp
```

---

## Step 7: Install Python Dependencies

Run this command in your backend directory:

```bash
pip install firebase-admin
```

Or add to requirements.txt:
```
firebase-admin==6.4.0
```

---

## Step 8: Environment Variables (Recommended)

Instead of hardcoding the path, you can use environment variables.

Create a `.env` file in `backend/Project_Content/`:

```env
FIREBASE_CREDENTIALS_PATH=ContentApp/firebase-service-account.json
```

---

## Verification Checklist

- [ ] Firebase project created
- [ ] Firestore database enabled
- [ ] Service account JSON file downloaded
- [ ] JSON file placed in `ContentApp/firebase-service-account.json`
- [ ] `firebase-service-account.json` added to `.gitignore`
- [ ] `firebase-admin` package installed
- [ ] Security rules configured (for production)

---

## Troubleshooting

### Error: "Could not find credentials"
- Make sure the `firebase-service-account.json` file is in the correct location
- Check the file path in `firebase_config.py`

### Error: "Permission denied"
- Check your Firestore security rules
- Make sure you're using the correct service account

### Error: "Project not found"
- Verify the project ID in your service account JSON matches your Firebase project

---

## Next Steps

After completing these steps, run the backend:

```bash
cd backend/Project_Content
uvicorn ContentApp.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will now use Firebase Firestore instead of SQLite!
