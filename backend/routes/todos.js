const express = require('express');
const router = express.Router();
const Todo = require('../models/todo');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET all todos for user
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.findByUserId(req.user.id);
    res.json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create todo
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required.' });
    const todo = await Todo.create({ ...req.body, user_id: req.user.id });
    res.status(201).json({ message: 'Todo created', id: todo.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update todo
router.put('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    if (todo.user_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    await Todo.update(req.params.id, req.body);
    res.json({ message: 'Todo updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH quick status update
router.patch('/:id/status', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    if (todo.user_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    await Todo.updateStatus(req.params.id, req.body.status);
    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE todo
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    if (todo.user_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    await Todo.delete(req.params.id);
    res.json({ message: 'Todo deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
