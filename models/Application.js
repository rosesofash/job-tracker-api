const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    postingUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'postingUrl must start with http:// or https://'],
    },

    // applied: false  -> it's on your "want to apply" list
    // applied: true   -> you've sent it in
    applied: { type: Boolean, default: false },
    dateApplied: { type: Date },

    // Which resume you used (points at a document in the resumes collection)
    // Not used by the frontend any more: it now uses resumeUrl below instead.
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },

    // Links to the resume and cover letter you sent for this job (Google Drive, etc.)
    resumeUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'resumeUrl must start with http:// or https://'],
    },
    coverLetterUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'coverLetterUrl must start with http:// or https://'],
    },

    callback: {
      type: String,
      enum: ['none', 'screen', 'interview', 'offer', 'rejected'],
      default: 'none',
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', applicationSchema);
