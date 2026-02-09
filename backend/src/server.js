require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const redisClient = require('./config/redis');
const routes = require('./routes');
const podcastProcessor = require('./services/podcastProcessor');
const podcastScheduler = require('./services/podcastScheduler');
const newsScheduler = require('./services/newsScheduler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to Redis
    await redisClient.connect();
    console.log('✓ Connected to Redis');

    app.listen(PORT, () => {
      console.log(`✓ Backend server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV}`);

      // Auto-process latest podcast episode on startup (non-blocking)
      if (process.env.GOOGLE_AI_API_KEY && process.env.GOOGLE_AI_API_KEY !== 'your_api_key_here') {
        console.log('✓ Checking for latest podcast episode...');
        podcastProcessor.processLatestEpisode()
          .then(result => {
            if (result) {
              console.log(`✓ Podcast ready: ${result.episode.title}`);
            }
          })
          .catch(err => {
            console.error('✗ Podcast processing failed:', err.message);
          });

        // Start scheduled polling for new episodes
        podcastScheduler.start();
      } else {
        console.log('○ Podcast transcription disabled (GOOGLE_AI_API_KEY not configured)');
      }

      // Start player news monitoring
      newsScheduler.start();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  podcastScheduler.stop();
  newsScheduler.stop();
  await redisClient.quit();
  process.exit(0);
});

startServer();

module.exports = app;
