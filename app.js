require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const booksRoutes = require('./routes/books');
const errorHandler = require('./middleware/errorHandler');
// const apiKey = require('./middleware/apiKey'); // optional

const app = express();
const PORT = process.env.PORT || 3000;

// security & parsing
app.use(helmet());
app.use(cors());
app.use(express.json());

// optional: protect write routes with API key
// app.use(apiKey);

// routes
app.use('/api/v1/books', booksRoutes);

// root
app.get('/', (req, res) => res.send('✅ Library API is running!'));

// error handler (must be last)
app.use(errorHandler);

// connect & start
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Failed to connect:', err.message);
  }
}

startServer();
