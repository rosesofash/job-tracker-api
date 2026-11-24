const express = require('express');
const Resume = require('../models/Resume');

const router = express.Router();

// CREATE  -> POST /api/resumes
router.post('/', async (req, res) => {
  const resume = await Resume.create(req.body);
  res.status(201).json(resume);
});

// READ all -> GET /api/resumes
router.get('/', async (req, res) => {
  res.json(await Resume.find().sort({ createdAt: -1 }));
});

// READ one -> GET /api/resumes/:id
router.get('/:id', async (req, res) => {
  const resume = await Resume.findById(req.params.id);
  if (!resume) return res.status(404).json({ error: 'Resume not found' });
  res.json(resume);
});

// UPDATE -> PUT /api/resumes/:id
router.put('/:id', async (req, res) => {
  const resume = await Resume.findByIdAndUpdate(req.params.id, req.body, {
    new: true,           // return the updated version
    runValidators: true, // re-check the schema rules on update
  });
  if (!resume) return res.status(404).json({ error: 'Resume not found' });
  res.json(resume);
});

// DELETE -> DELETE /api/resumes/:id
router.delete('/:id', async (req, res) => {
  const resume = await Resume.findByIdAndDelete(req.params.id);
  if (!resume) return res.status(404).json({ error: 'Resume not found' });
  res.json({ message: 'Deleted', id: resume._id });
});

module.exports = router;
