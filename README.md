# BrainRoom - Collaborative Study Platform

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Server
cd server
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment
Create `server/.env`:
```env
PORT=3000
MONGODB_URI=your_mongodb_uri
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
```

### 3. Test API (Optional)
```bash
cd server
node test-gemini.js
```

### 4. Start Application
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Open Browser
http://localhost:5173

## ✨ Features

- 📄 **PDF Upload & AI Quiz** - Upload notes, get AI-generated questions
- 🤖 **AI Tutor Chat** - Ask questions about your notes (Gemini 2.5 Flash)
- 💬 **Group Chat** - Real-time messaging
- ⏱️ **Pomodoro Timer** - 8 presets + custom duration (1-120 min)
- 🎨 **Whiteboard** - Collaborative drawing
- 🏆 **Leaderboard** - Live score tracking
- 🔐 **Authentication** - User accounts with JWT

## 🎯 How to Use

1. **Create Room** - Enter name, get 6-letter code
2. **Share Code** - Invite friends
3. **Upload PDF** - Host uploads study notes (max 10MB)
4. **Generate Quiz** - AI creates questions automatically
5. **Study Together** - Use timer, chat, whiteboard
6. **Track Progress** - View leaderboard

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, MongoDB, Socket.io
- **Frontend:** React, Vite, TailwindCSS
- **AI:** Google Gemini 2.5 Flash
- **Real-time:** Socket.io

## 📝 Notes

- PDF files must be text-based (not scanned images)
- Maximum file size: 10MB
- Requires valid Gemini API key
- MongoDB connection required

---

Made with ❤️ for collaborative learning

