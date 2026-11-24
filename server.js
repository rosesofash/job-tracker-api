const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json()); // lets the server read JSON sent in request bodies

// Serve the frontend: any file in the public/ folder is sent to the browser as-is.
// Visiting http://localhost:3000 loads public/index.html automatically.
// (On Vercel this line is skipped: Vercel serves the public/ folder itself.)
app.use(express.static('public'));

// On Vercel, the public/ files are served at /index.html, /style.css, etc.,
// but a visit to plain "/" reaches Express instead. Send those visitors to the page.
// (On my laptop express.static already handles "/", so this line never runs there.)
app.get('/', (req, res) => res.redirect('/index.html'));

// ----- Database connection -----
// On my laptop the server starts once and stays running.
// On Vercel the app starts up when a request comes in, so instead of connecting
// once at startup, we connect on the first request and reuse that connection after.
let connectionPromise = null;

function connectToDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Add it to .env (locally) or to Vercel Environment Variables.');
  }
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI) // <-- the backend <-> database connection
      .then(() => console.log('Connected to MongoDB'))
      .catch((err) => {
        connectionPromise = null; // let the next request try again
        throw err;
      });
  }
  return connectionPromise;
}

// Before any /api request, make sure we're connected to the database
app.use('/api', async (req, res, next) => {
  await connectToDatabase();
  next();
});

// Health check: a quick way to confirm the API is running.
// (This used to be GET /, but that would block the web page, so it moved here.)
app.get('/api/health', (req, res) => res.json({ message: 'Job tracker API is running' }));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/applications', require('./routes/applications'));

// Central error handler: turns database errors into readable responses
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

// ----- Running on my laptop (npm run dev) -----
// "require.main === module" is true only when this file is run directly with node.
// On Vercel it isn't, so Vercel uses the exported app below instead.
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  connectToDatabase()
    .then(() => {
      app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
    })
    .catch((err) => {
      console.error('Failed to start:', err.message);
      process.exit(1);
    });
}

// Vercel needs the app exported so it can run it
module.exports = app;
