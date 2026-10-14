import app from './app.js';
import config from './config/config.js';
import sequelize from './config/database.js';
import './models/index.js'; // Ensure all model associations are loaded

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection authenticated successfully.');

    const server = app.listen(config.port, () => {
      console.log(`Express server running on http://localhost:${config.port}`);
    });

    const gracefulShutdown = async (signal) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        try {
          await sequelize.close();
          console.log('Database connection closed.');
          process.exit(0);
        } catch (err) {
          console.error('Error closing database connection:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();
