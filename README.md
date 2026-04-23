# ✨ HeyChat - Full Stack Realtime Chat App



A modern, feature-rich real-time chat application built with the MERN stack, Socket.io, and beautiful UI components.
[

## 🚀 Features

- **🔐 Authentication & Authorization**: Secure JWT-based authentication system
- **💬 Real-time Messaging**: Instant messaging with Socket.io
- **👥 Online User Status**: See who's online in real-time
- **🖼️ Image Sharing**: Upload and share images via Cloudinary
- **🎨 Modern UI**: Beautiful interface with TailwindCSS and DaisyUI
- **📱 Responsive Design**: Works seamlessly on desktop and mobile
- **⚡ State Management**: Efficient state management with Zustand
- **🛡️ Error Handling**: Comprehensive error handling on both client and server
- **🔒 Security**: Protected routes and API endpoints

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **DaisyUI** - Component library for TailwindCSS
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management
- **Socket.io Client** - Real-time client communication
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.io** - Real-time server communication
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Cloudinary** - Cloud image storage
- **Cookie Parser** - Cookie handling middleware

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Cloudinary account (for image uploads)

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd fullstack-chat-app
```

### 2. Install dependencies

```bash
npm run build
```

This command installs dependencies for both backend and frontend, and builds the frontend.

### 3. Set up environment variables

Create a `.env` file in the `backend` directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/heychat
PORT=5001

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Environment
NODE_ENV=development
```

### 4. Start the application

```bash
npm start
```

This will start the backend server. The frontend is already built and served from the backend.

## 📁 Project Structure

```
fullstack-chat-app/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── socket/
│   │   └── index.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── hooks/
│   │   └── main.jsx
│   ├── public/
│   └── package.json
├── package.json
└── README.md
```

## 🎯 Development

### Running in Development Mode

For development with hot reload:

```bash
# Backend development
cd backend && npm run dev

# Frontend development (in separate terminal)
cd frontend && npm run dev
```

### Available Scripts

- `npm run build` - Install all dependencies and build frontend
- `npm start` - Start the production server
- `npm run dev --prefix backend` - Start backend in development mode
- `npm run dev --prefix frontend` - Start frontend in development mode

## 🔧 Configuration

### MongoDB Setup

1. **Local MongoDB**: Make sure MongoDB is running on `mongodb://localhost:27017`
2. **MongoDB Atlas**: Use the connection string from your Atlas cluster

### Cloudinary Setup

1. Sign up for a free Cloudinary account
2. Get your cloud name, API key, and API secret from the dashboard
3. Add them to your `.env` file

## 🚀 Deployment

The app is ready for deployment on platforms like:
- **Vercel** (for frontend)
- **Render** or **Heroku** (for backend)
- **DigitalOcean** or **AWS** (for full-stack)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built following the [YouTube Tutorial](https://youtu.be/ntKkVrQqBYY)
- Thanks to all the open-source libraries that made this project possible
