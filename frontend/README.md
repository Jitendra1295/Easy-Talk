# Chat App Frontend

A modern, real-time chat application built with React, TypeScript, and Socket.IO.

## Features

### ✅ Core Features
- **One-to-One Chat**: Private messaging between two users
- **Group Chat**: Create and join chat rooms with multiple users
- **Real-time Messaging**: Instant message delivery using Socket.IO
- **Message History**: Persistent message storage with MongoDB
- **Online/Offline Status**: Real-time user status indicators
- **Typing Indicators**: Shows when users are typing
- **Unread Message Count**: Track unread messages per chat
- **Last Message Preview**: See the last message in chat list

### ✅ User Experience
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Real-time Updates**: Live message delivery and status updates
- **File Upload**: Support for images and documents
- **Message Status**: Read receipts and delivery status
- **Search Functionality**: Search through chats and messages
- **Responsive Design**: Works on desktop and mobile devices

### ✅ Technical Features
- **TypeScript**: Full type safety throughout the application
- **TanStack Query**: Efficient data fetching and caching
- **Socket.IO**: Real-time bidirectional communication
- **React Hook Form**: Form validation and handling
- **React Router**: Client-side routing
- **Toast Notifications**: User feedback with react-hot-toast

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **TanStack Query** - Data fetching and caching
- **Socket.IO Client** - Real-time communication
- **React Router DOM** - Routing
- **React Hook Form** - Form handling
- **Lucide React** - Icons
- **React Hot Toast** - Notifications
- **Date-fns** - Date utilities

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Backend server running (see backend README)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Avatar.tsx     # User avatar component
│   ├── LoadingSpinner.tsx
│   ├── MessageBubble.tsx
│   └── TypingIndicator.tsx
├── contexts/           # React contexts
│   ├── AuthContext.tsx
│   └── ChatContext.tsx
├── pages/              # Page components
│   ├── Chat.tsx       # Main chat interface
│   ├── Login.tsx      # Login page
│   └── Register.tsx   # Registration page
├── services/           # API and socket services
│   ├── api.ts         # HTTP API client
│   └── socket.ts      # Socket.IO client
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   ├── cn.ts          # Class name utility
│   └── date.ts        # Date formatting utilities
├── App.tsx            # Main app component
├── main.tsx           # App entry point
└── index.css          # Global styles
```

## Key Components

### Authentication
- **Login/Register**: Secure user authentication with JWT
- **Protected Routes**: Automatic redirection for unauthenticated users
- **Persistent Sessions**: Remember user login state

### Chat Interface
- **Sidebar**: Chat list with search and new chat options
- **Message Area**: Real-time message display with auto-scroll
- **Input Area**: Message composition with file upload support
- **Typing Indicators**: Real-time typing status

### Real-time Features
- **Socket Connection**: Automatic connection management
- **Message Broadcasting**: Real-time message delivery
- **Status Updates**: Online/offline status synchronization
- **Typing Indicators**: Live typing status
- **Read Receipts**: Message read status tracking

## API Integration

The frontend communicates with the backend through:

- **REST API**: HTTP requests for CRUD operations
- **Socket.IO**: Real-time bidirectional communication
- **JWT Authentication**: Secure token-based auth

### API Endpoints Used

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `GET /api/users` - Get all users
- `GET /api/chats` - Get user's chats
- `POST /api/chats/private` - Create private chat
- `POST /api/chats/group` - Create group chat
- `GET /api/chats/:id/messages` - Get chat messages
- `POST /api/chats/:id/messages` - Send message
- `PUT /api/chats/:id/messages/read` - Mark as read

## Socket Events

### Client to Server
- `join:chat` - Join a chat room
- `leave:chat` - Leave a chat room
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `message:read` - Mark messages as read

### Server to Client
- `message:new` - New message received
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `message:read` - Messages marked as read
- `user:online` - User came online
- `user:offline` - User went offline

## State Management

### TanStack Query
- **Automatic Caching**: Efficient data caching
- **Background Updates**: Real-time data synchronization
- **Optimistic Updates**: Immediate UI feedback
- **Error Handling**: Graceful error management

### React Context
- **AuthContext**: User authentication state
- **ChatContext**: Chat and message state

## Styling

### Tailwind CSS
- **Utility-first**: Rapid UI development
- **Responsive**: Mobile-first design
- **Custom Components**: Reusable styled components
- **Dark Mode Ready**: Easy theme switching

### Custom Styles
- **Message Bubbles**: Distinct styling for sent/received messages
- **Typing Animation**: Smooth typing indicator
- **Status Indicators**: Online/offline status
- **Custom Scrollbars**: Styled scrollbars

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details 