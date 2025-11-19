const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "books.json");

app.use(express.json());

// =======================
// Load data from file
// =======================
let books = [];
if (fs.existsSync(DATA_FILE)) {
  const rawData = fs.readFileSync(DATA_FILE);
  books = JSON.parse(rawData);
} else {
  books = [
    { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald", available: true },
    { id: 2, title: "1984", author: "George Orwell", available: false },
    { id: 3, title: "To Kill a Mockingbird", author: "Harper Lee", available: true }
  ];
  fs.writeFileSync(DATA_FILE, JSON.stringify(books, null, 2));
}

function saveBooks() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(books, null, 2));
}

// =======================
// 📍 ROUTES (with /api/v1 prefix)
// =======================

// ✅ GET – Retrieve all books
app.get("/api/v1/books", (req, res) => {
  res.json(books);
});

// ✅ GET (single book by ID)
app.get("/api/v1/books/:id", (req, res) => {
  const book = books.find(b => b.id === parseInt(req.params.id));
  if (!book) return res.status(404).json({ message: "Book not found" });
  res.json(book);
});

// ✅ POST – Add new book
app.post("/api/v1/books", (req, res) => {
  const { title, author, available } = req.body;
  if (!title || !author) {
    return res.status(400).json({ message: "Title and author are required" });
  }
  const newBook = {
    id: books.length ? books[books.length - 1].id + 1 : 1,
    title,
    author,
    available: available ?? true
  };
  books.push(newBook);
  saveBooks();
  res.status(201).json(newBook);
});

// ✅ PUT – Update existing book
app.put("/api/v1/books/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const book = books.find(b => b.id === id);
  if (!book) return res.status(404).json({ message: "Book not found" });

  const { title, author, available } = req.body;
  book.title = title ?? book.title;
  book.author = author ?? book.author;
  book.available = available ?? book.available;

  saveBooks();
  res.json({ message: "Book updated successfully", book });
});

// ✅ DELETE – Remove book
app.delete("/api/v1/books/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = books.findIndex(b => b.id === id);
  if (index === -1) return res.status(404).json({ message: "Book not found" });

  books.splice(index, 1);
  saveBooks();
  res.json({ message: "Book deleted successfully" });
});

// ✅ POST – Borrow a book
app.post("/api/v1/borrow/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { borrower } = req.body;

  const book = books.find(b => b.id === id);
  if (!book) return res.status(404).json({ message: "Book not found" });

  if (!book.available) {
    return res.status(400).json({ message: "Book is already borrowed" });
  }

  if (!borrower) {
    return res.status(400).json({ message: "Borrower name is required" });
  }

  book.available = false;
  book.borrower = borrower;
  book.borrowedAt = new Date().toISOString();

  saveBooks();
  res.json({ message: "Book borrowed successfully", book });
});

// ✅ POST – Return a book
app.post("/api/v1/return/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const book = books.find(b => b.id === id);
  if (!book) return res.status(404).json({ message: "Book not found" });

  if (book.available) {
    return res.status(400).json({ message: "Book is not currently borrowed" });
  }

  book.available = true;
  delete book.borrower;
  delete book.borrowedAt;

  saveBooks();
  res.json({ message: "Book returned successfully", book });
});

// =======================
// Start Server
// =======================
app.listen(PORT, () => {
  console.log(`Library API running at http://localhost:${PORT}/api/v1/books`);
});
