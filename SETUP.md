# AirDoc Dashboard - Setup Guide

This guide will walk you through setting up the AirDoc Operations Dashboard from scratch, even if you have no coding experience.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installing Node.js](#installing-nodejs)
3. [Cloning and Installing the Project](#cloning-and-installing-the-project)
4. [Setting Up Firebase](#setting-up-firebase)
5. [Creating Your First Admin User](#creating-your-first-admin-user)
6. [Running Locally](#running-locally)
7. [Deploying to GitHub Pages](#deploying-to-github-pages)
8. [Social Media API Setup (Optional)](#social-media-api-setup-optional)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, you'll need:
- A computer with internet access
- A Google account (for Firebase)
- A GitHub account (for deployment)

---

## Installing Node.js

Node.js is required to run this application.

### macOS
1. Go to https://nodejs.org/
2. Download the **LTS (Long Term Support)** version
3. Open the downloaded file and follow the installer instructions
4. Restart your Terminal application

### Windows
1. Go to https://nodejs.org/
2. Download the **LTS (Long Term Support)** version
3. Run the installer and check "Automatically install necessary tools"
4. Follow the installer instructions
5. Restart your computer

### Verify Installation
Open Terminal (Mac) or Command Prompt (Windows) and type:
```bash
node --version
npm --version
```
You should see version numbers for both.

---

## Cloning and Installing the Project

1. **Open Terminal/Command Prompt**

2. **Navigate to where you want the project**
   ```bash
   cd Desktop
   ```

3. **Clone the repository**
   ```bash
   git clone https://github.com/p-wedisinghe/airdoc_management_dashboard.git
   cd airdoc_management_dashboard
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```
   This may take a few minutes.

---

## Setting Up Firebase

Firebase provides the authentication and database for this application.

### Step 1: Create a Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Create a project"** (or "Add project")
3. Enter a project name: `airdoc-dashboard`
4. Click **Continue**
5. Disable Google Analytics (not needed) and click **Create project**
6. Wait for the project to be created, then click **Continue**

### Step 2: Enable Email/Password Authentication

1. In the Firebase Console, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Click on **"Email/Password"** under "Native providers"
4. Toggle **"Enable"** to ON
5. Click **Save**

### Step 3: Create Firestore Database

1. In the Firebase Console, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Select **"Start in test mode"** (we'll update rules later)
4. Choose a location closest to your users (e.g., `australia-southeast1` for Australia)
5. Click **Enable**

### Step 4: Register Your Web App

1. Click the **gear icon** next to "Project Overview" and select **"Project settings"**
2. Scroll down to "Your apps" section
3. Click the **Web icon** (`</>`)
4. Enter a nickname: `AirDoc Dashboard`
5. Check **"Also set up Firebase Hosting"** (optional)
6. Click **Register app**
7. You'll see a code block with `firebaseConfig` - **keep this page open!**

### Step 5: Configure Environment Variables

1. In your project folder, create a new file called `.env` (no filename, just .env)
2. Copy the following and paste into `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_SOCIAL_API_ENABLED=false
```

3. Replace each value with the corresponding value from the Firebase config you saw earlier:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`

### Step 6: Deploy Firestore Security Rules

1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init firestore
   ```
   - Select your project from the list
   - Accept the default file names

4. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## Creating Your First Admin User

Since user management requires an admin account, you need to create the first admin manually.

### Step 1: Create a User in Firebase Auth

1. Go to Firebase Console → **Authentication** → **Users** tab
2. Click **"Add user"**
3. Enter your email and a password
4. Click **Add user**
5. **Copy the User UID** (the long string in the "User UID" column)

### Step 2: Create User Document in Firestore

1. Go to Firebase Console → **Firestore Database**
2. Click **"Start collection"**
3. Collection ID: `users`
4. Document ID: **Paste the User UID you copied**
5. Add the following fields:
   - `name` (string): Your name
   - `email` (string): Your email
   - `role` (string): `admin`
   - `active` (boolean): `true`
   - `createdAt` (timestamp): Click the clock icon and select current time
6. Click **Save**

Now you can log in with admin privileges!

---

## Running Locally

1. **Make sure you're in the project folder**
   ```bash
   cd airdoc_management_dashboard
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   The terminal will show a URL like `http://localhost:5173`
   Open this URL in your browser

4. **Log in**
   Use the email and password you created in Firebase

5. **Seed Sample Data (Optional)**
   After logging in as admin, the app includes sample data seeding functionality.
   Open browser console (F12 → Console) and run:
   ```javascript
   // This is handled within the app when in development mode
   ```

---

## Deploying to GitHub Pages

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `airdoc_management_dashboard`
3. Make it **Public** (required for free GitHub Pages)
4. Click **Create repository**

### Step 2: Push Your Code

```bash
git remote add origin https://github.com/YOUR_USERNAME/airdoc_management_dashboard.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy

```bash
npm run deploy
```

This will build the app and push to a `gh-pages` branch.

### Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (in left sidebar)
3. Under "Source", select **Deploy from a branch**
4. Select branch: `gh-pages`, folder: `/ (root)`
5. Click **Save**

### Step 5: Add Authorized Domain in Firebase

1. Go to Firebase Console → **Authentication** → **Settings**
2. Click **"Authorized domains"** tab
3. Click **"Add domain"**
4. Add: `YOUR_USERNAME.github.io`
5. Click **Add**

Your app will be live at: `https://YOUR_USERNAME.github.io/airdoc_management_dashboard/`

---

## Social Media API Setup (Optional)

To enable automatic data sync from social media platforms, follow these steps for each platform you want to connect.

### Meta (Facebook/Instagram)

1. Go to https://developers.facebook.com/
2. Create a new App → Select "Business" type
3. Add "Marketing API" product
4. Get your App ID and App Secret
5. Add to `.env`:
   ```env
   VITE_META_APP_ID=your_app_id
   VITE_META_APP_SECRET=your_app_secret
   ```

### LinkedIn

1. Go to https://www.linkedin.com/developers/
2. Create a new App
3. Under Products, add "Marketing API"
4. Get Client ID and Client Secret
5. Add to `.env`:
   ```env
   VITE_LINKEDIN_CLIENT_ID=your_client_id
   ```

### Google Ads

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable Google Ads API
4. Create OAuth credentials
5. Add to `.env`:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_client_id
   ```

### TikTok

1. Go to https://ads.tiktok.com/marketing_api/
2. Create a developer account
3. Create an App
4. Add to `.env`:
   ```env
   VITE_TIKTOK_APP_ID=your_app_id
   ```

### Enable API Integration

After adding credentials, set:
```env
VITE_SOCIAL_API_ENABLED=true
```

Then rebuild and redeploy your app.

---

## Troubleshooting

### "Firebase: No Firebase App" error
- Make sure your `.env` file is in the root folder
- Check that all Firebase config values are filled in correctly
- Restart the development server after changing `.env`

### "Permission denied" when reading/writing data
- Make sure you've deployed the Firestore security rules
- Verify your user document in Firestore has the correct role

### Login doesn't work
- Verify Email/Password auth is enabled in Firebase
- Check browser console for error messages
- Make sure the user exists in both Auth and Firestore

### GitHub Pages shows blank page
- Make sure `base` in `vite.config.js` matches your repo name
- Clear browser cache and refresh
- Wait a few minutes for GitHub Pages to update

### Charts don't show data
- Make sure you have acquisition/churn records in the database
- Use the seed data function to populate sample data
- Check browser console for errors

---

## User Roles Reference

| Role | Dashboard | Backend Panel | User Management |
|------|-----------|---------------|-----------------|
| Viewer | Read Only | No Access | No Access |
| Manager | Read Only | Full Access | No Access |
| Admin | Read Only | Full Access | Full Access |

---

## Support

If you encounter issues:
1. Check the browser console (F12) for error messages
2. Verify your Firebase configuration
3. Make sure all environment variables are set correctly
4. Try clearing browser cache and reloading

For additional help, contact your system administrator.
