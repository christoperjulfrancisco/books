const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/booksController');
const validateId = require('../middleware/validateObjectId');

/**
 * @swagger
 * tags:
 *   name: Books
 *   description: API for books in BugBunnies Library
 */

/**
 * @swagger
 * /books:
 *   post:
 *     summary: Create a new book
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "1984"
 *               author:
 *                 type: string
 *                 example: "George Orwell"
 *     responses:
 *       201:
 *         description: Book created successfully
 */
router.post('/', ctrl.createBook);

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for title or author
 *     responses:
 *       200:
 *         description: List of books
 */
router.get('/', ctrl.getBooks);

/**
 * @swagger
 * /books/search:
 *   get:
 *     summary: Search books by title or author
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', ctrl.getBooks);

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: Get a single book by ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *     responses:
 *       200:
 *         description: Book found
 *       404:
 *         description: Book not found
 */
router.get('/:id', validateId, ctrl.getBook);

/**
 * @swagger
 * /books/{id}:
 *   put:
 *     summary: Update a book completely
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Book updated
 *       404:
 *         description: Book not found
 */
router.put('/:id', validateId, ctrl.updateBook);

/**
 * @swagger
 * /books/{id}:
 *   patch:
 *     summary: Update a book partially
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Book updated
 *       404:
 *         description: Book not found
 */
router.patch('/:id', validateId, ctrl.patchBook);

/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     summary: Delete a book
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book deleted
 *       404:
 *         description: Book not found
 */
router.delete('/:id', validateId, ctrl.deleteBook);

/**
 * @swagger
 * /books/borrow/{id}:
 *   post:
 *     summary: Borrow a book
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               borrower:
 *                 type: string
 *                 example: "John Doe"
 *     responses:
 *       200:
 *         description: Book borrowed
 *       400:
 *         description: Already borrowed or borrower missing
 *       404:
 *         description: Book not found
 */
router.post('/borrow/:id', validateId, ctrl.borrowBook);

/**
 * @swagger
 * /books/return/{id}:
 *   post:
 *     summary: Return a borrowed book
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *     responses:
 *       200:
 *         description: Book returned
 *       400:
 *         description: Book is not borrowed
 *       404:
 *         description: Book not found
 */
router.post('/return/:id', validateId, ctrl.returnBook);

module.exports = router;