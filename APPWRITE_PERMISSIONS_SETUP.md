# 🔐 Appwrite Permissions Setup Guide

## ⚠️ CRITICAL: Set Up Database Permissions

After running the setup script, you **MUST** configure permissions in the Appwrite Console for the database to work properly.

### Step-by-Step Instructions:

1. **Go to Appwrite Console**

   - Open your browser and go to [Appwrite Console](https://cloud.appwrite.io)
   - Login to your account
   - Select your CodeQuest project

2. **Navigate to Database**

   - Click on **"Databases"** in the left sidebar
   - Click on **"codequest_db"** database

3. **Set Permissions for user_progress Collection**

   - Click on **"user_progress"** collection
   - Click on **"Settings"** tab
   - Click on **"Permissions"**
   - Click **"Add a permission"**
   - Select **"Users"** (authenticated users)
   - Check all boxes: **Create**, **Read**, **Update**, **Delete**
   - Click **"Add"**

4. **Set Permissions for user_achievements Collection**
   - Go back to the database view
   - Click on **"user_achievements"** collection
   - Click on **"Settings"** tab
   - Click on **"Permissions"**
   - Click **"Add a permission"**
   - Select **"Users"** (authenticated users)
   - Check all boxes: **Create**, **Read**, **Update**, **Delete**
   - Click **"Add"**

### ✅ Verification

After setting up permissions, you should see:

- No more 400/404 errors in the browser console
- User progress saving to Appwrite database
- Successful login and registration

### 🚨 Common Issues

**If you still get errors:**

1. Make sure you selected **"Users"** not **"Any"** for security
2. Ensure all CRUD permissions are checked
3. Wait a few seconds for permissions to propagate
4. Refresh your application page

### 🔧 Alternative: Quick Permission Setup

If you prefer, you can temporarily set permissions to **"Any"** for testing:

1. Follow steps 1-3 above
2. Instead of "Users", select **"Any"**
3. This allows unauthenticated access (less secure, only for testing)

---

**Once permissions are set up, your CodeQuest application will work seamlessly with Appwrite! 🎉**
