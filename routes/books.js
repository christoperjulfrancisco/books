const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/booksController');
const validateId = require('../middleware/validateObjectId');

// routes
router.post('/', ctrl.createBook);
router.get('/', ctrl.getBooks);
router.get('/search', ctrl.getBooks);
router.get('/:id', validateId, ctrl.getBook);
router.put('/:id', validateId, ctrl.updateBook);
router.patch('/:id', validateId, ctrl.patchBook);
router.delete('/:id', validateId, ctrl.deleteBook);
router.post('/borrow/:id', validateId, ctrl.borrowBook);
router.post('/return/:id', validateId, ctrl.returnBook);

module.exports = router;
