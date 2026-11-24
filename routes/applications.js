const express = require('express');
const Application = require('../models/Application');

const router = express.Router();

// CREATE  -> POST /api/applications
router.post('/', async (req, res) => {
  const application = await Application.create(req.body);
  res.status(201).json(application);
});

// READ all -> GET /api/applications
// Optional filters:  ?applied=true   ?applied=false   ?callback=interview
router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.applied !== undefined) filter.applied = req.query.applied === 'true';
  if (req.query.callback) filter.callback = req.query.callback;

  const applications = await Application.find(filter)
    .populate('resume', 'name fileUrl') // swap the resume id for its name + link
    .sort({ createdAt: -1 });
  res.json(applications);
});

// READ one -> GET /api/applications/:id
router.get('/:id', async (req, res) => {
  const application = await Application.findById(req.params.id).populate('resume');
  if (!application) return res.status(404).json({ error: 'Application not found' });
  res.json(application);
});

// UPDATE -> PUT /api/applications/:id
router.put('/:id', async (req, res) => {
  const application = await Application.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!application) return res.status(404).json({ error: 'Application not found' });
  res.json(application);
});

// DELETE -> DELETE /api/applications/:id
router.delete('/:id', async (req, res) => {
  const application = await Application.findByIdAndDelete(req.params.id);
  if (!application) return res.status(404).json({ error: 'Application not found' });
  res.json({ message: 'Deleted', id: application._id });
});

module.exports = router;
