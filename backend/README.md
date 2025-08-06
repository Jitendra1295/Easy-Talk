# Chat Application Backend

A real-time chat application backend built with Node.js, Express, TypeScript, Socket.IO, and MongoDB.

## Features

- ✅ **User Authentication**: JWT-based authentication with secure password hashing
- ✅ **One-to-One Chat**: Private messaging between two users
- ✅ **Group Chat**: Create and manage group conversations
- ✅ **Real-time Messaging**: Instant message delivery using Socket.IO
- ✅ **Message History**: Persistent message storage in MongoDB
- ✅ **Online/Offline Status**: Real-time user status indicators
- ✅ **Typing Indicators**: Show when users are typing
- ✅ **Unread Message Count**: Track unread messages per chat
- ✅ **Message Read Receipts**: Know when messages are read
- ✅ **User Search**: Find users by username or email
- ✅ **Profile Management**: Update user profiles and avatars

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chat-app-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment example
   cp env.example .env
   
   # Edit .env file with your configuration
   nano .env
   ```

4. **Environment Variables**
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/chat-app
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   
   # Socket.IO Configuration
   CORS_ORIGIN=http://localhost:3000
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

5. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod
   
   # Or use MongoDB Atlas (cloud)
   ```

6. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production build
   npm run build
   npm start
   ```

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "new_username",
  "avatar": "https://example.com/avatar.jpg"
}
```

### Chat Endpoints

#### Get User Chats
```http
GET /api/chats?page=1&limit=20
Authorization: Bearer <token>
```

#### Get Specific Chat
```http
GET /api/chats/:chatId
Authorization: Bearer <token>
```

#### Get Chat Messages
```http
GET /api/chats/:chatId/messages?page=1&limit=50
Authorization: Bearer <token>
```

#### Create Private Chat
```http
POST /api/chats/private
Authorization: Bearer <token>
Content-Type: application/json

{
  "participantId": "user_id_here"
}
```

#### Create Group Chat
```http
POST /api/chats/group
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Group",
  "description": "Group description",
  "participants": ["user_id_1", "user_id_2"]
}
```

#### Mark Messages as Read
```http
PUT /api/chats/:chatId/read
Authorization: Bearer <token>
```

#### Search Users
```http
GET /api/users/search?query=john
Authorization: Bearer <token>
```

## Socket.IO Events

### Client to Server Events

#### Join Chat
```javascript
socket.emit('joinChat', 'chat_id_here');
```

#### Send Message
```javascript
socket.emit('sendMessage', {
  chatId: 'chat_id_here',
  content: 'Hello world!',
  messageType: 'text' // 'text', 'image', 'file'
});
```

#### Typing Indicator
```javascript
socket.emit('typing', {
  chatId: 'chat_id_here',
  isTyping: true
});
```

#### Mark Message as Read
```javascript
socket.emit('markAsRead', 'message_id_here');
```

#### Create Group
```javascript
socket.emit('createGroup', {
  name: 'Group Name',
  description: 'Group description',
  participants: ['user_id_1', 'user_id_2']
});
```

### Server to Client Events

#### New Message
```javascript
socket.on('message', (message) => {
  console.log('New message:', message);
});
```

#### Typing Indicator
```javascript
socket.on('typing', (data) => {
  console.log(`${data.user.username} is typing...`);
});
```

#### User Online/Offline
```javascript
socket.on('userOnline', (userId) => {
  console.log('User online:', userId);
});

socket.on('userOffline', (userId) => {
  console.log('User offline:', userId);
});
```

#### Message Read Receipt
```javascript
socket.on('messageRead', (data) => {
  console.log('Message read:', data);
});
```

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  avatar: String,
  isOnline: Boolean,
  lastSeen: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Chat Collection
```javascript
{
  _id: ObjectId,
  type: String ('private' | 'group'),
  participants: [ObjectId],
  name: String (for groups),
  description: String (for groups),
  avatar: String (for groups),
  admin: ObjectId (for groups),
  lastMessage: ObjectId,
  unreadCount: Map,
  createdAt: Date,
  updatedAt: Date
}
```

### Message Collection
```javascript
{
  _id: ObjectId,
  sender: ObjectId,
  content: String,
  messageType: String ('text' | 'image' | 'file'),
  chatId: ObjectId,
  readBy: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Configurable CORS settings
- **Rate Limiting**: Prevent abuse with request limits
- **Helmet**: Security headers
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: Mongoose ODM protection

## Error Handling

The API returns consistent error responses:

```javascript
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Development

### Scripts
```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

### Project Structure
```
src/
├── config/
│   └── database.ts
├── controllers/
│   ├── authController.ts
│   └── chatController.ts
├── middleware/
│   ├── auth.ts
│   └── validation.ts
├── models/
│   ├── User.ts
│   ├── Chat.ts
│   └── Message.ts
├── routes/
│   ├── auth.ts
│   └── chat.ts
├── services/
│   └── socketService.ts
├── types/
│   └── index.ts
├── utils/
│   └── jwt.ts
├── app.ts
└── index.ts
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details 