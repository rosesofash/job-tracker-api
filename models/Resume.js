const mongoose = require('mongoose');

// A resume / CV you keep on file so you can copy it any time.
const resumeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },   // e.g. "General CV - Fall 2026"
    fileUrl: { type: String, trim: true },                // link to the file (Google Drive, etc.)
  },
  { timestamps: true } // adds createdAt + updatedAt automatically
);

module.exports = mongoose.model('Resume', resumeSchema);
