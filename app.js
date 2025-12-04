require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const booksRoutes = require('./routes/books');
const errorHandler = require('./middleware/errorHandler');
const bookRoutes = require('./routes/books');
const app = express();
const PORT = process.env.PORT || 3000;

// security & parsing
app.use(helmet());
app.use(cors());
app.use(express.json());

// routes
app.use('/api/v1/books', booksRoutes);
app.use('/api/v1', bookRoutes); 

// swagger
const setupSwagger = require('./swagger');
setupSwagger(app);

app.listen(3000, () => {
  console.log('Server running on https://books-gamma-rosy.vercel.app');
  console.log('Swagger docs at http://localhost:3000/api-docs');
});

// root
app.get('/', (req, res) => res.send('✅ Library API is running!'));

// error handler
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