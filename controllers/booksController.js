const Book = require('../models/Book');

exports.createBook = async (req, res, next) => {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).json({ 
      success: true, 
      message: 'Book created', 
      data: book 
    });
  } catch (err) { next(err); }
};

exports.getBooks = async (req, res, next) => {
  try {
    const q = req.query.q;
    const filter = q ? { $or: [{ title: { $regex: q, $options: 'i' }}, { author: { $regex: q, $options: 'i' }}] } : {};
    const books = await Book.find(filter).sort({ createdAt: -1 });
    res.json({ 
      success: true, 
      data: books 
    });
  } catch (err) { next(err); }
};

exports.getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ 
      success:false, 
      message:'Book not found' 
    });

    res.json({ 
      success: true, 
      data: book 
    });
  } catch (err) { next(err); }
};

exports.updateBook = async (req, res, next) => {
  try {
    delete req.body.borrower;
    delete req.body.borrowedAt;
    delete req.body.available;
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!book) return res.status(404).json({ 
      success:false, 
      message:'Book not found' 
    });

    res.json({ success:true, data: book });
  } catch (err) { next(err); }
};

exports.patchBook = async (req, res, next) => {
  try {
    delete req.body.borrower;
    delete req.body.borrowedAt;
    delete req.body.available;
    const book = await Book.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });

    if (!book) return res.status(404).json({ 
      success:false, 
      message:'Book not found' 
    });
    
    res.json({ 
      success:true, 
      data: book 
    });
  } catch (err) { next(err); }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const b = await Book.findByIdAndDelete(req.params.id);
    if (!b) return res.status(404).json({ 
      success:false, 
      message:'Book not found' 
    });

    res.json({
      success:true, 
      message:'Book deleted' 
    });
  } catch (err) { next(err); }
};

exports.borrowBook = async (req, res, next) => {
  try {
    const { borrower } = req.body;
    if (!borrower) return res.status(400).json({ 
      success:false, 
      message: 'Borrower required' 
    
    });

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ 
      success:false, 
      message:'Not found' 
    });

    if (!book.available) return res.status(400).json({ 
      success:false, 
      message:'Already borrowed' });

    book.available = false;
    book.borrower = borrower;
    book.borrowedAt = new Date();
    await book.save();
    res.json({ 
      success:true, 
      message:'Borrowed', 
      data: book 
    });
  } catch (err) { next(err); }
};

exports.returnBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({
      success:false, 
      message:'Not found'
    });

    if (book.available) return res.status(400).json({ 
      success:false, 
      message:'Book is not borrowed' 
    });

    book.available = true;
    book.borrower = undefined;
    book.borrowedAt = undefined;
    await book.save();
    res.json({ 
      success:true, 
      message:'Returned', 
      data: book 
    });
  } catch (err) { next(err); }
};