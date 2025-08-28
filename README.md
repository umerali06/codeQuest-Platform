# CodeQuest - Interactive Coding Learning Platform

A modern, full-stack web application for learning HTML, CSS, and JavaScript through interactive lessons, coding challenges, and AI-powered assistance.

## 🚀 Features

- **Interactive Learning Modules**: Structured lessons for HTML, CSS, and JavaScript
- **Coding Challenges**: Real-time code testing with immediate feedback
- **AI-Powered Assistance**: DeepSeek AI integration for code help and error explanation
- **User Authentication**: Secure login/signup via Appwrite with JWT tokens
- **Progress Tracking**: Monitor learning progress and earn XP
- **Responsive Design**: Mobile-first design that works on all devices
- **Code Editor**: Monaco Editor with syntax highlighting and linting
- **Gamification**: XP system, levels, and achievements

## 🏗️ Architecture

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: PHP 8 + MySQL
- **Authentication**: Appwrite SDK with JWT tokens
- **AI Integration**: DeepSeek API (proxied through backend)
- **Code Editor**: Monaco Editor with ESLint, HTMLHint, Stylelint
- **Database**: MySQL with PDO

## 📁 Project Structure

```
codeQuest/
├── api/                    # PHP API endpoints
│   └── index.php         # Main API router
├── db/                    # Database files
│   └── migrations/       # SQL schema and seed data
├── logs/                  # Application logs
├── public/                # Frontend files
│   ├── index.html        # Landing page
│   ├── login.html        # Authentication page
│   ├── learn.html        # Learning modules
│   ├── editor.html       # Code editor
│   ├── games.html        # Coding games
│   └── *.js              # Page-specific JavaScript
├── src/                   # PHP source code
│   ├── Core/             # Core classes (Database, Auth, Router, Logger)
│   └── Controllers/      # API controllers
├── .env.sample           # Environment variables template
├── composer.json         # PHP dependencies
└── README.md            # This file
```

## 🛠️ Installation & Setup

### Prerequisites

- PHP 8.0 or higher
- MySQL 5.7 or higher
- Composer
- Web server (Apache/Nginx) or PHP built-in server
- Appwrite account (for authentication) - [Sign up here](https://appwrite.io)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd codeQuest-Platform
```

### 2. Install Dependencies

```bash
composer install
```

### 3. Appwrite Configuration

1. Create an Appwrite project at [cloud.appwrite.io](https://cloud.appwrite.io)
2. Enable **Email/Password** authentication
3. Enable **Google OAuth** (optional but recommended)
4. Note your **Project ID** and **Endpoint**

### 4. Environment Configuration

```bash
cp .env.sample .env
```

Edit `.env` with your configuration:

```env
# Database
DB_HOST=localhost
DB_NAME=codequest
DB_USER=your_username
DB_PASS=your_password

# Appwrite Configuration (REQUIRED for authentication)
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_actual_project_id
APPWRITE_API_KEY=your_api_key

# DeepSeek AI (REQUIRED - Get your key from https://platform.deepseek.com/)
DEEPSEEK_API_KEY=your_actual_deepseek_api_key_here

# Server
PORT=8000
NODE_ENV=development
```

### 5. Database Setup (Automated)

```bash
# Run the setup script to create database and sample data
php setup.php
```

### 6. Start Development Server

```bash
# Using PHP built-in server
php -S localhost:8000 -t public
```

### 7. Verify Installation

- **Platform**: http://localhost:8000
- **API Health**: http://localhost:8000/api/health
- **Appwrite Test**: http://localhost:8000/test-appwrite.html
- **AI Assistant**: Available on all pages (click the 🤖 button)

### 8. Test Authentication

1. Visit the Appwrite test page: http://localhost:8000/test-appwrite.html
2. Run all tests to verify Appwrite integration
3. Test Google OAuth (if configured)
4. Try creating an account on the main platform

## 🔐 Authentication Setup

### Appwrite Configuration

1. Create an Appwrite project at [cloud.appwrite.io](https://cloud.appwrite.io)
2. Enable Email/Password and Google OAuth authentication
3. Create an API key with appropriate permissions
4. Update your `.env` file with Appwrite credentials

### Frontend Integration

The platform uses the Appwrite SDK for client-side authentication:

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
  .setEndpoint("YOUR_APPWRITE_ENDPOINT")
  .setProject("YOUR_PROJECT_ID");

const account = new Account(client);
```

## 🎯 API Endpoints

### Authentication

- `GET /api/me` - Get current user profile
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Learning Content

- `GET /api/modules` - List all learning modules
- `GET /api/modules/:slug` - Get specific module details
- `GET /api/lessons/:slug` - Get lesson content and challenges

### Challenges & Progress

- `GET /api/challenges/:id` - Get challenge details
- `POST /api/attempts` - Submit challenge attempt
- `GET /api/attempts` - Get user's challenge attempts

### AI Integration

- `POST /api/ai/generate` - Generate AI-powered code assistance

### Games & Statistics

- `POST /api/games/result` - Save game results
- `GET /api/games/leaderboard` - Get leaderboard
- `GET /api/games/stats` - Get user game statistics

## 🎨 Frontend Features

### AI Assistant Widget

The AI assistant is globally available across all pages and provides:

- **Context-Aware Help**: Understands current page, module, and lesson
- **Code Generation**: Generates code based on requirements
- **Error Explanation**: Explains code errors and provides solutions
- **Editor Integration**: "Try in Editor" and "Insert to Editor" actions

### Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Desktop Enhancement**: Enhanced features for larger screens
- **Editor Layout**: Vertical split on desktop, stacked on mobile

### Code Editor

- **Monaco Editor**: Professional-grade code editing experience
- **Syntax Highlighting**: Support for HTML, CSS, and JavaScript
- **Real-time Linting**: ESLint, HTMLHint, and Stylelint integration
- **Error Display**: Clear line numbers and error messages

## 🧪 Testing

### Client-Side Testing

The platform includes a sandboxed testing environment:

- **Mocha + Chai**: Test framework and assertions
- **Iframe Sandbox**: Isolated testing environment
- **Real-time Results**: Immediate feedback on code execution

### Test Execution

```javascript
// Example test specification
{
  "tests": [
    {
      "name": "Button should be visible",
      "code": "expect(document.querySelector('button')).to.exist;"
    }
  ]
}
```

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Ensure all sensitive data is properly configured
2. **Database**: Use production-grade MySQL with proper backups
3. **SSL**: Enable HTTPS for secure authentication
4. **Logging**: Configure proper log rotation and monitoring
5. **Performance**: Enable PHP OPcache and MySQL query optimization

### Docker Support

```dockerfile
FROM php:8.1-apache
RUN docker-php-ext-install pdo pdo_mysql
COPY . /var/www/html/
RUN composer install --no-dev --optimize-autoloader
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔮 Roadmap

- [ ] Additional programming languages (Python, React, Node.js)
- [ ] Advanced gamification features
- [ ] Collaborative coding challenges
- [ ] Mobile app development
- [ ] Integration with external learning platforms

---

**CodeQuest** - Empowering developers to learn, practice, and master coding skills through interactive experiences and AI-powered assistance.
