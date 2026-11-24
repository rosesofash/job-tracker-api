// =====================================================================
// Job Tracker frontend
// Talks to our own API (same server), so URLs start with /api/...
// =====================================================================

// Friendly names for the callback values stored in the database
const CALLBACK_LABELS = {
  none: 'No response yet',
  screen: 'Phone screen',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

// ----- Things we need to remember while the page is open -----
let applications = [];     // the applications currently shown in the list
let currentFilter = 'all'; // 'all', 'applied' or 'saved'
let editingId = null;      // the _id being edited, or null when adding a new one

// ----- Grab the parts of the page we'll work with -----
const form = document.getElementById('application-form');
const formTitle = document.getElementById('form-title');
const formMessage = document.getElementById('form-message');
const saveButton = document.getElementById('save-button');
const cancelButton = document.getElementById('cancel-button');
const listElement = document.getElementById('application-list');
const listMessage = document.getElementById('list-message');
const emptyMessage = document.getElementById('empty-message');
const appliedCheckbox = document.getElementById('applied');
const dateInput = document.getElementById('dateApplied');

// =====================================================================
// Helpers
// =====================================================================

// Sends a request to the API and returns the JSON answer.
// If the API says something went wrong, it throws an Error with a friendly message.
async function callApi(url, method = 'GET', body) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    // fetch only fails like this when the server can't be reached at all
    throw new Error('Could not reach the server. Is it running?');
  }

  // If the answer isn't JSON, we're probably not talking to our Express API
  // (for example, the page was opened with VS Code's Live Server instead of localhost:3000).
  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error('The API did not answer. Make sure "npm run dev" is running and open the page at http://localhost:3000');
  }

  if (!response.ok) {
    throw new Error(friendlyError(data));
  }
  return data;
}

// Turns the API's technical error text into plain sentences.
// Example API answer: { error: 'Validation failed', details: '... Path `company` is required. ...' }
function friendlyError(data) {
  const details = data.details || data.error || '';
  const messages = [];

  if (details.includes('Path `company` is required')) messages.push('Please enter the company name.');
  if (details.includes('Path `role` is required')) messages.push('Please enter the role or job title.');
  if (details.includes('postingUrl must start')) messages.push('The posting link must start with http:// or https://');
  if (details.includes('resumeUrl must start')) messages.push('The resume link must start with http:// or https://');
  if (details.includes('coverLetterUrl must start')) messages.push('The cover letter link must start with http:// or https://');
  if (details.includes('dateApplied')) messages.push('Please enter a valid date applied.');
  if (details.includes('not found')) messages.push('That application no longer exists. It may have been deleted.');

  // If we didn't recognise the error, show what the server said
  if (messages.length === 0) messages.push(data.error || 'Something went wrong. Please try again.');
  return messages.join(' ');
}

// Shows a message box. type is 'error' or 'success'.
function showMessage(box, text, type) {
  box.textContent = text;
  box.className = 'message ' + type;
  box.hidden = false;
}

function hideMessage(box) {
  box.hidden = true;
}

// Creates an HTML element with an optional class and text.
// Using textContent (not innerHTML) means anything the user typed is shown as plain text,
// so it can't accidentally be run as HTML or code.
function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

// Today's date as YYYY-MM-DD (the format a date input uses)
function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// Shows a saved date nicely, e.g. "Nov 23, 2026".
// Dates from a date input are saved as midnight UTC, so we display them in UTC
// to avoid them showing up a day early in some time zones.
function formatDate(dateValue) {
  if (!dateValue) return 'Not set';
  return new Date(dateValue).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

// =====================================================================
// Applications list
// =====================================================================

// Loads applications from the API, using the current filter
async function loadApplications() {
  let url = '/api/applications';
  if (currentFilter === 'applied') url += '?applied=true';
  if (currentFilter === 'saved') url += '?applied=false';

  try {
    applications = await callApi(url);
    hideMessage(listMessage);
    renderApplications();
  } catch (err) {
    showMessage(listMessage, 'Could not load applications: ' + err.message, 'error');
  }
}

// Draws the list of applications on the page
function renderApplications() {
  listElement.innerHTML = ''; // clear the old list

  // Empty state: nothing to show
  if (applications.length === 0) {
    const emptyTexts = {
      all: 'No applications yet. Add your first one with the form.',
      applied: "You haven't marked any jobs as applied yet.",
      saved: 'Your "want to apply" list is empty.',
    };
    emptyMessage.textContent = emptyTexts[currentFilter];
    emptyMessage.hidden = false;
    return;
  }
  emptyMessage.hidden = true;

  for (const app of applications) {
    listElement.append(makeCard(app));
  }
}

// Builds one card for one application
function makeCard(app) {
  // The extra class lets the CSS colour the card's stripe by status
  const card = makeElement('li', app.applied ? 'card is-applied' : 'card is-saved');

  // Top row: company name + status badge
  const top = makeElement('div', 'card-top');
  top.append(makeElement('h3', '', app.company));
  if (app.applied) {
    top.append(makeElement('span', 'badge applied', 'Applied'));
  } else {
    top.append(makeElement('span', 'badge saved', 'Want to apply'));
  }
  card.append(top);

  card.append(makeElement('p', 'role', app.role));

  // Details list: date, callback
  const details = makeElement('dl', 'details');
  details.append(makeElement('dt', '', 'Date applied'));
  details.append(makeElement('dd', '', formatDate(app.dateApplied)));

  // The callback is shown as a coloured pill, e.g. purple for "Interview"
  details.append(makeElement('dt', '', 'Callback'));
  const callbackCell = makeElement('dd');
  callbackCell.append(
    makeElement('span', 'pill callback-' + app.callback, CALLBACK_LABELS[app.callback] || app.callback)
  );
  details.append(callbackCell);
  card.append(details);

  if (app.notes) {
    card.append(makeElement('p', 'notes', app.notes));
  }

  // Links: job posting, resume, cover letter.
  // The schema only allows links starting with http:// or https://, so they're safe to link to.
  const links = makeElement('div', 'card-links');
  const linkList = [
    [app.postingUrl, 'Job posting'],
    [app.resumeUrl, 'Resume'],
    [app.coverLetterUrl, 'Cover letter'],
  ];
  for (const [url, text] of linkList) {
    if (!url) continue; // skip links that weren't filled in
    const link = makeElement('a', '', text);
    link.href = url;
    link.target = '_blank';  // open in a new tab
    link.rel = 'noopener';
    links.append(link);
  }
  if (links.children.length > 0) card.append(links);

  // Buttons
  const buttons = makeElement('div', 'card-buttons');

  if (!app.applied) {
    const markButton = makeElement('button', 'button small primary', 'Mark as applied');
    markButton.type = 'button';
    markButton.addEventListener('click', () => markAsApplied(app));
    buttons.append(markButton);
  }

  const editButton = makeElement('button', 'button small', 'Edit');
  editButton.type = 'button';
  editButton.addEventListener('click', () => startEditing(app));
  buttons.append(editButton);

  const deleteButton = makeElement('button', 'button small danger', 'Delete');
  deleteButton.type = 'button';
  deleteButton.addEventListener('click', () => deleteApplication(app));
  buttons.append(deleteButton);

  card.append(buttons);
  return card;
}

// =====================================================================
// Add / edit form
// =====================================================================

// Reads the form fields into an object the API understands
function readForm() {
  return {
    company: document.getElementById('company').value.trim(),
    role: document.getElementById('role').value.trim(),
    postingUrl: document.getElementById('postingUrl').value.trim(),
    applied: appliedCheckbox.checked,
    // Empty date -> null, which tells the database "no value"
    dateApplied: dateInput.value || null,
    resumeUrl: document.getElementById('resumeUrl').value.trim(),
    coverLetterUrl: document.getElementById('coverLetterUrl').value.trim(),
    callback: document.getElementById('callback').value,
    notes: document.getElementById('notes').value.trim(),
  };
}

// Puts an existing application's values into the form
function fillForm(app) {
  document.getElementById('company').value = app.company || '';
  document.getElementById('role').value = app.role || '';
  document.getElementById('postingUrl').value = app.postingUrl || '';
  appliedCheckbox.checked = app.applied;
  // Saved dates look like "2026-11-23T00:00:00.000Z"; the input wants "2026-11-23"
  dateInput.value = app.dateApplied ? app.dateApplied.slice(0, 10) : '';
  document.getElementById('resumeUrl').value = app.resumeUrl || '';
  document.getElementById('coverLetterUrl').value = app.coverLetterUrl || '';
  document.getElementById('callback').value = app.callback || 'none';
  document.getElementById('notes').value = app.notes || '';
}

// Switches the form into "edit" mode for one application
function startEditing(app) {
  editingId = app._id;
  fillForm(app);
  formTitle.textContent = `Edit: ${app.company}`;
  saveButton.textContent = 'Save changes';
  cancelButton.hidden = false;
  hideMessage(formMessage);
  form.scrollIntoView({ behavior: 'smooth' });
  document.getElementById('company').focus();
}

// Clears the form and goes back to "add" mode
function stopEditing() {
  editingId = null;
  form.reset();
  formTitle.textContent = 'Add an application';
  saveButton.textContent = 'Add application';
  cancelButton.hidden = true;
}

// Runs when the form is submitted (Add or Save button)
form.addEventListener('submit', async (event) => {
  event.preventDefault(); // stop the browser from reloading the page
  hideMessage(formMessage);

  const data = readForm();
  try {
    if (editingId) {
      await callApi(`/api/applications/${editingId}`, 'PUT', data);
      showMessage(formMessage, `Saved changes to ${data.company}.`, 'success');
    } else {
      await callApi('/api/applications', 'POST', data);
      showMessage(formMessage, `Added ${data.company}.`, 'success');
    }
    stopEditing();
    loadApplications();
  } catch (err) {
    // e.g. a 400 because the company is missing
    showMessage(formMessage, err.message, 'error');
  }
});

cancelButton.addEventListener('click', () => {
  stopEditing();
  hideMessage(formMessage);
});

// Small convenience: ticking "I've applied" fills in today's date if it's empty
appliedCheckbox.addEventListener('change', () => {
  if (appliedCheckbox.checked && !dateInput.value) {
    dateInput.value = todayString();
  }
});

// =====================================================================
// Card actions
// =====================================================================

// Quick button: turn a "want to apply" job into an applied one
async function markAsApplied(app) {
  try {
    await callApi(`/api/applications/${app._id}`, 'PUT', {
      applied: true,
      dateApplied: app.dateApplied || todayString(), // keep an existing date, otherwise use today
    });
    showMessage(listMessage, `Marked ${app.company} as applied.`, 'success');
    loadApplications();
  } catch (err) {
    showMessage(listMessage, err.message, 'error');
  }
}

async function deleteApplication(app) {
  const sure = confirm(`Delete ${app.company} (${app.role})? This can't be undone.`);
  if (!sure) return;

  try {
    await callApi(`/api/applications/${app._id}`, 'DELETE');
    if (editingId === app._id) stopEditing(); // don't keep editing something that's gone
    showMessage(listMessage, `Deleted ${app.company}.`, 'success');
    loadApplications();
  } catch (err) {
    showMessage(listMessage, err.message, 'error');
  }
}

// =====================================================================
// Filter buttons (All / Applied / Want to apply)
// =====================================================================

const filterButtons = document.querySelectorAll('.filter-button');
for (const button of filterButtons) {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    // Mark only the clicked button as pressed
    for (const other of filterButtons) {
      other.setAttribute('aria-pressed', String(other === button));
    }
    hideMessage(listMessage);
    loadApplications();
  });
}

// =====================================================================
// Start: load everything when the page opens
// =====================================================================
loadApplications();
