require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const bookRoutes = require('./routes/bookRoutes');
const { authenticate } = require('./middleware/auth');
const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = '/api/v1';
const swaggerDocument = YAML.load('./docs/swagger.yaml');

app.use(helmet()); 
app.use(cors());   
app.use(express.json());
app.use(API_PREFIX, authenticate);
app.use(API_PREFIX, bookRoutes);
app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ Error: MONGODB_URI is not defined in the .env file.");
    process.exit(1);
}

async function connectDB() {
    try {
        const connectionOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, 
        };

        await mongoose.connect(MONGODB_URI, connectionOptions);
        console.log("✅ Successfully connected to MongoDB.");
        
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        process.exit(1); 
    }
}

const startApp = async () => {
    await connectDB(); 
    app.listen(PORT, () => {
        console.log(`🚀 Library API running at http://localhost:${PORT}${API_PREFIX}/books`);
        console.log(`📄 Documentation available at http://localhost:${PORT}/api-docs`);
    });
};

// Mongoose Book schema
const bookSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true }, 
  title: { type: String, required: [true, 'title is required'] },
  author: { type: String, required: [true, 'author is required'] },
  available: { type: Boolean, default: true },
  borrower: { type: String, default: null },
  borrowedAt: { type: Date, default: null }
}, { timestamps: true });

const Book = mongoose.model('Book', bookSchema);

// Helpers
async function nextId() {
  const doc = await Book.findOne().sort({ id: -1 }).select('id').lean();
  return doc && typeof doc.id === 'number' ? doc.id + 1 : 1;
}

function isValidNumberId(id) {
  return /^\d+$/.test(String(id));
}

// GET all books (with optional pagination)
app.get(`${API_PREFIX}/books`, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1'));
    const limit = Math.min(100, parseInt(req.query.limit || '50'));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Book.find().sort({ id: 1 }).skip(skip).limit(limit).lean(),
      Book.countDocuments()
    ]);

    res.json({ total, page, limit, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single book by numeric id
app.get(`${API_PREFIX}/books/:id`, async (req, res) => {
  try {
    const idParam = req.params.id;
    if (!isValidNumberId(idParam)) return res.status(400).json({ message: 'Invalid book id (must be numeric)' });
    const id = parseInt(idParam);
    const book = await Book.findOne({ id }).lean();
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create new book
app.post(`${API_PREFIX}/books`, async (req, res) => {
  try {
    const { title, author, available } = req.body;
    if (!title || !author) return res.status(400).json({ message: 'Title and author are required' });
    const newId = await nextId();
    const book = new Book({
      id: newId,
      title,
      author,
      available: available ?? true
    });

    await book.save();
    res.status(201).json(book);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    if (err.name === 'MongoServerError' && err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate key', details: err.keyValue });
    }
    res.status(500).json({ message: err.message });
  }
});

// PUT update existing book
app.put(`${API_PREFIX}/books/:id`, async (req, res) => {
  try {
    const idParam = req.params.id;
    if (!isValidNumberId(idParam)) return res.status(400).json({ message: 'Invalid book id (must be numeric)' });
    const id = parseInt(idParam);

    const updates = {};
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.author !== undefined) updates.author = req.body.author;
    if (req.body.available !== undefined) updates.available = req.body.available;
    const book = await Book.findOneAndUpdate({ id }, updates, { new: true, runValidators: true });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book updated successfully', book });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    res.status(500).json({ message: err.message });
  }
});

// DELETE remove book
app.delete(`${API_PREFIX}/books/:id`, async (req, res) => {
  try {
    const idParam = req.params.id;
    if (!isValidNumberId(idParam)) return res.status(400).json({ message: 'Invalid book id (must be numeric)' });
    const id = parseInt(idParam);
    const doc = await Book.findOneAndDelete({ id });
    if (!doc) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Borrow a book 
async function borrowHandler(req, res) {
  try {
    const idParam = req.params.id;
    if (!isValidNumberId(idParam)) return res.status(400).json({ message: 'Invalid book id (must be numeric)' });
    const id = parseInt(idParam);
    const { borrower } = req.body;

    if (!borrower) return res.status(400).json({ message: 'Borrower name is required' });
    const book = await Book.findOne({ id });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (!book.available) return res.status(400).json({ message: 'Book is already borrowed' });

    book.available = false;
    book.borrower = borrower;
    book.borrowedAt = new Date();
    await book.save();

    res.json({ message: 'Book borrowed successfully', book });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
app.post(`${API_PREFIX}/borrow/:id`, borrowHandler);
app.put(`${API_PREFIX}/borrow/:id`, borrowHandler);

// Return a book 
async function returnHandler(req, res) {
  try {
    const idParam = req.params.id;
    if (!isValidNumberId(idParam)) return res.status(400).json({ message: 'Invalid book id (must be numeric)' });
    const id = parseInt(idParam);
    const book = await Book.findOne({ id });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (book.available) return res.status(400).json({ message: 'Book is not currently borrowed' });
    book.available = true;
    book.borrower = null;
    book.borrowedAt = null;
    await book.save();
    res.json({ message: 'Book returned successfully', book });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
app.post(`${API_PREFIX}/return/:id`, returnHandler);
app.put(`${API_PREFIX}/return/:id`, returnHandler); 

// Start server + Mongo
async function startServer() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/library';
  const opts = { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 5000 };

  try {
    await mongoose.connect(mongoUri, opts);
    console.log('Connected to MongoDB:', mongoUri);
    const count = await Book.estimatedDocumentCount();
    if (count === 0) {
      await Book.create([
        { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', available: true },
        { id: 2, title: '1984', author: 'George Orwell', available: false, borrower: 'Alice', borrowedAt: new Date() },
        { id: 3, title: 'To Kill a Mockingbird', author: 'Harper Lee', available: true }
      ]);
      console.log('ℹ️  Seeded initial books');
    }

    const server = app.listen(PORT, () => {
      console.log(`Library API running at http://localhost:${PORT}${API_PREFIX}/books`);
    });

    const shutdown = async () => {
      console.log('Shutting down...');
      server.close();
      await mongoose.disconnect();
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

startServer();
