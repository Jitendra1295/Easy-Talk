import { createServer } from 'http';
import app from './app';
import { connectDatabase } from './config/database';
import { SocketService } from './services/socketService';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDatabase();
        console.log('✅ Database connected successfully');

        // Create HTTP server
        const server = createServer(app);

        // Initialize Socket.IO service
        const socketService = new SocketService(server);
        console.log('✅ Socket.IO service initialized');

        // Start server
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('🔄 SIGTERM received, shutting down gracefully');
            server.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer(); 