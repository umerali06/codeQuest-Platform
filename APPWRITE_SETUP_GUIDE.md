# Appwrite Setup Guide for CodeQuest

## Overview

This guide will help you properly set up Appwrite for the CodeQuest platform. The application uses Appwrite for:

- User authentication (registration, login, sessions)
- User progress tracking (XP, levels, completed lessons)
- User achievements storage

## Prerequisites

1. **Appwrite Account**: You need an account at [cloud.appwrite.io](https://cloud.appwrite.io)
2. **Project Created**: You should have created a project in Appwrite
3. **API Key**: You need an API key with database permissions

## Current Configuration

Your `.env` file shows:

- **Project ID**: `68ad2f3400028ae2b8e5`
- **Endpoint**: `https://fra.cloud.appwrite.io/v1`
- **API Key**: Already configured

## Setup Steps

### Step 1: Install Dependencies

Make sure you have the Appwrite PHP SDK installed:

```bash
composer require appwrite/appwrite
```

### Step 2: Run the Appwrite Setup Script

The setup script will create the required database and collections in your Appwrite project.

**Windows:**

```bash
setup-appwrite.bat
```

**Unix/Linux/Mac:**

```bash
chmod +x setup-appwrite.sh
./setup-appwrite.sh
```

**Manual:**

```bash
php setup-appwrite.php
```

### Step 3: Verify Setup

The script will create:

1. **Database**: `codequest_db`
2. **Collections**:
   - `user_progress` - Stores user XP, levels, and learning progress
   - `user_achievements` - Stores earned achievements

### Step 4: Configure Permissions (Important!)

After running the setup script, you need to configure permissions in the Appwrite console:

1. Go to your Appwrite project dashboard
2. Navigate to **Databases** → **codequest_db**
3. For each collection (`user_progress`, `user_achievements`):
   - Click on the collection
   - Go to **Settings** → **Permissions**
   - Add these permissions:
     - **Create**: `users` (authenticated users can create their own documents)
     - **Read**: `users` (authenticated users can read their own documents)
     - **Update**: `users` (authenticated users can update their own documents)
     - **Delete**: `users` (authenticated users can delete their own documents)

## Database Schema

### user_progress Collection

| Field               | Type     | Description                    |
| ------------------- | -------- | ------------------------------ |
| user_id             | string   | Appwrite user ID               |
| total_xp            | integer  | Total experience points        |
| level               | integer  | Current user level             |
| level_title         | string   | Level title (e.g., "Beginner") |
| streak              | integer  | Learning streak days           |
| html_xp             | integer  | HTML-specific XP               |
| css_xp              | integer  | CSS-specific XP                |
| javascript_xp       | integer  | JavaScript-specific XP         |
| html_lessons        | integer  | Completed HTML lessons         |
| css_lessons         | integer  | Completed CSS lessons          |
| javascript_lessons  | integer  | Completed JavaScript lessons   |
| html_progress       | double   | HTML progress percentage       |
| css_progress        | double   | CSS progress percentage        |
| javascript_progress | double   | JavaScript progress percentage |
| last_login          | datetime | Last login timestamp           |

### user_achievements Collection

| Field          | Type     | Description                 |
| -------------- | -------- | --------------------------- |
| user_id        | string   | Appwrite user ID            |
| achievement_id | string   | Achievement identifier      |
| earned_at      | datetime | When achievement was earned |

## Testing the Setup

1. **Start the development server**:

   ```bash
   php -S localhost:8080 router.php
   ```

2. **Open the application**: Visit `http://localhost:8080`

3. **Test authentication**:

   - Click "Sign Up" to create a new account
   - Complete the registration process
   - Check the browser console for success messages

4. **Verify database**:
   - After registration, check your Appwrite console
   - You should see a new document in the `user_progress` collection

## Expected Console Messages

When everything is working correctly, you should see:

✅ **Success Messages**:

- "Appwrite initialized successfully"
- "User progress created in Appwrite"
- "User progress loaded from Appwrite"
- "Progress updated in Appwrite"

❌ **Error Messages to Watch For**:

- "Database not found" → Run the setup script
- "Collection not found" → Check collection creation
- "Insufficient permissions" → Configure permissions in Appwrite console

## Troubleshooting

### Database Not Found Error

```
AppwriteException: Database not found
```

**Solution**: Run `php setup-appwrite.php` to create the database and collections.

### Permission Denied Error

```
AppwriteException: Insufficient permissions
```

**Solution**: Configure collection permissions in the Appwrite console as described in Step 4.

### API Key Issues

```
AppwriteException: Invalid API key
```

**Solution**: Check that your `APPWRITE_API_KEY` in `.env` has database permissions.

## Security Notes

1. **API Key**: Keep your API key secure and never commit it to version control
2. **Permissions**: Only grant necessary permissions to collections
3. **Validation**: The application includes client-side validation, but Appwrite provides server-side security

## Next Steps

After successful setup:

1. Test user registration and login
2. Complete a lesson to verify progress tracking
3. Check the Appwrite console to see data being stored
4. Customize the progress tracking as needed for your application

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Appwrite project settings
3. Ensure all collections have proper permissions
4. Test with a fresh user account

The application is designed to gracefully fall back to localStorage if Appwrite is unavailable, but for the full experience, proper Appwrite setup is essential.
