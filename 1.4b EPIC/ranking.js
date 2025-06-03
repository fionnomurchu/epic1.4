// Import Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Supabase project URL and public anon key
const SUPABASE_URL = "https://arzbecskqesqesfgmkgu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ";

//  Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get DOM elements from html file
const nameList = document.getElementById('nameList');
const errorMessage = document.getElementById('errorMessage');
const positionList = document.getElementById('positionList');
const residencySelect = document.getElementById('residencySelect');

// State variables
let nameItems = [];
let assignedPositions = new Map();
let jobs = [];

// Normalize residency numbers into consistent groupings
const groupedResidency = (res) => {
  const norm = res?.replace(/\s+/g, '').toUpperCase();
  return (norm === 'R1' || norm === 'R1+R2' || norm === 'R2+R1') ? 'R1GROUP' : norm;
};

//Log-out functionality
document.getElementById('logout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  window.location.href = 'index.html';
});

// Build the job list UI
function initializeList() {
  nameList.innerHTML = '';
  nameItems = [];
  assignedPositions.clear();
  errorMessage.style.display = 'none';
  updatePositionDisplay();

  jobs.forEach((job) => {
    // Create a job item container
    const item = document.createElement('div');
    item.className = 'name-item';

    // Header row: toggle and job title and input for ranking
    const header = document.createElement('div');
    header.className = 'name-header';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-description';
    toggleBtn.innerHTML = '&#9654;';

    const description = document.createElement('div');
    description.className = 'description';
    description.innerHTML = `
      <strong>Location:</strong> ${job.location || 'N/A'}<br>
      <strong>Salary:</strong> €${job.monthly_salary || 'N/A'}<br>
      <strong>Accommodation:</strong> ${job.accommodation_support || 'N/A'}<br>
      <strong>Special Conditions:</strong> ${job.special_conditions || 'None'}<br>
      <strong>Positions Available:</strong> ${job.positions_available || 'N/A'}<br>
      <strong>Description:</strong> ${job.description || 'N/A'}<br>
    `;

    toggleBtn.addEventListener('click', () => toggleDescription(toggleBtn, description));
    
    //job title headings
    const nameHeading = document.createElement('h3');
    nameHeading.className = 'name-text';
    nameHeading.textContent = job.title;

    //box beside job titles
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'position-input';
    input.placeholder = 'Rank';
    input.dataset.name = job.title;
    input.dataset.jobId = job.id;
    input.dataset.previousValue = '';
    input.min = "1";

    input.addEventListener('change', () => updatePositions(input));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') updatePositions(input);
    });

    header.appendChild(toggleBtn);
    header.appendChild(nameHeading);
    header.appendChild(input);

    item.appendChild(header);
    item.appendChild(description);

    nameList.appendChild(item);

    // Store metadata for later use
    nameItems.push({
      element: item,
      name: job.title,
      id: job.id,
      residency: groupedResidency(job.residency_number),
      input,
      description,
      toggleBtn
    });
  });
}

// Toggle job description display
function toggleDescription(button, description) {
  const isVisible = description.classList.toggle('visible');
  button.classList.toggle('rotated', isVisible);
}

// Handle ranking input changes
function updatePositions(changedInput) {
  errorMessage.style.display = 'none';
  const newValue = changedInput.value;
  const jobId = changedInput.dataset.jobId;
  const previousValue = changedInput.dataset.previousValue;

   // Remove previously assigned rank (if applicable)
  if (previousValue && assignedPositions.has(parseInt(previousValue))) {
    if (assignedPositions.get(parseInt(previousValue)) === jobId) {
      assignedPositions.delete(parseInt(previousValue));
      nameItems.forEach(item => {
        if (item.id === jobId) item.element.classList.remove('highlight');
      });
    }
  }

   // Add new ranking
  if (newValue !== '') {
    const positionNum = parseInt(newValue);
//validate to see if positive number
    if (isNaN(positionNum) || positionNum < 1) {
      showError("Please enter a positive number");
      changedInput.value = '';
      changedInput.dataset.previousValue = '';
      updatePositionDisplay();
      return;
    }
    //ensures rank isnt already assigned
    if (assignedPositions.has(positionNum)) {
      changedInput.value = previousValue || '';
      showError(`Rank ${positionNum} is already assigned to another job.`);
      return;
    }
    //stores new rank in assigned positions map
    assignedPositions.set(positionNum, jobId);
    //updates inputs previous value to new value
    changedInput.dataset.previousValue = newValue;
 
    nameItems.forEach(item => {
      if (item.id === jobId) item.element.classList.add('highlight');
    });
    //reset previous value if cleared
  } else {
    changedInput.dataset.previousValue = '';
  }

  updatePositionDisplay();
  sortList();
}

// Display error messages, block sets display to visible
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

// Sort jobs by ranking for display
function sortList() {
  const itemsWithPositions = nameItems.map(item => {
    const position = parseInt(item.input.value);
    return {
      ...item,
      position: isNaN(position) ? Infinity : position
    };
  });

  itemsWithPositions.sort((a, b) => a.position - b.position);
  //rebuild UI
  nameList.innerHTML = '';
  itemsWithPositions.forEach(item => nameList.appendChild(item.element));
}

// Update position preview box
function updatePositionDisplay() {
  if (assignedPositions.size === 0) {
    positionList.innerHTML = '<p>No rankings assigned yet</p>';
    return;
  }

  const sortedPositions = Array.from(assignedPositions.entries()).sort((a, b) => a[0] - b[0]);

  let html = '<div>';
  sortedPositions.forEach(([position, jobId]) => {
    const job = jobs.find(j => j.id === jobId);
    //store job metadata for when submitting to the server
    html += `
      <div class="position-item" 
           data-job-id="${jobId}" 
           data-job-title="${job.title}" 
           data-residency="${job.residency_number}">
        <strong>#${position}: ${job.title}</strong>
        <div style="font-size:0.9em; color:#666; margin-top:2px;">${job?.description || ''}</div>
      </div>
    `;
  });
  html += '</div>';
  positionList.innerHTML = html;
}

// Fetch available residencies to populate dropdown in sorted order
async function fetchResidencies() {
  const { data, error } = await supabase
    .from('jobs')
    .select('residency_number', { count: 'exact', distinct: true });

  if (error) {
    showError('Failed to fetch residencies. ' + error.message);
    return;
  }

  // Normalize and deduplicate
  const uniqueResidencies = [...new Set(data.map(row => groupedResidency(row.residency_number)))];

  // Sort R1GROUP first, then others alphabetically
  uniqueResidencies.sort((a, b) => {
    if (a === 'R1GROUP') return -1;
    if (b === 'R1GROUP') return 1;
    return a.localeCompare(b);
  });

  // Clear and repopulate dropdown
  residencySelect.innerHTML = `<option value="">-- Select Residency --</option>`;
  uniqueResidencies.forEach(res => {
    if (res) {
      const option = document.createElement('option');
      option.value = res;
      option.textContent = res === 'R1GROUP' ? 'R1 + R1+R2' : res;
      residencySelect.appendChild(option);
    }
  });
}

// Filter jobs by selected residency
residencySelect.addEventListener('change', () => {
  const selectedResidency = residencySelect.value;
  if (selectedResidency) {
    fetchJobsByResidency(selectedResidency);
  } else {
    nameList.innerHTML = '';
    positionList.innerHTML = '';
  }
});

// Fetch jobs matching a specific residency
async function fetchJobsByResidency(residency) {
  const all = await supabase.from('jobs').select('*');
  if (all.error) return showError(all.error.message);
  jobs = all.data.filter(job => groupedResidency(job.residency_number) === residency);
  initializeList();
}

// Handle submission of rankings to Supabase
document.getElementById('submitRankingBtn').addEventListener('click', async () => {
  const confirmSubmit = confirm("Are you sure you want to submit your rankings? This action cannot be undone.");
  if (!confirmSubmit) return;

  const ranks = [];
  let residencyValue = null;

  document.querySelectorAll('#positionList .position-item').forEach((item, index) => {
    const title = item.getAttribute('data-job-title');
    const residency = item.getAttribute('data-residency');

    ranks[index] = title || null;

    if (index === 0 && residency) {
      residencyValue = residency;
    }
  });

  const payload = {};
  for (let i = 0; i < 20; i++) {
    payload[`rank${i + 1}`] = ranks[i] || null;
  }
  payload.residency = residencyValue || null;

  console.log("Submitting payload:", payload);

  // Insert into 'ranking' table
  const { data, error } = await supabase
    .from('ranking')
    .insert([payload])
    .select('id')
    .single();

  if (error) {
    alertStyled('Error submitting rankings: ' + error.message);
  } else {
    const insertedRankingId = data.id;
    console.log('Inserted ranking ID:', insertedRankingId);
    await updateStudentRankingId(insertedRankingId);
    alertStyled('Rankings submitted successfully!');
    await sleep(2500); // Wait for 2.5 seconds before reloading
    window.location.reload();
  }
});

// On page load, fetch jobs and residencies
window.onload = async () => {
  await fetchResidencies();
};

// Update the student's record with the submitted ranking ID
async function updateStudentRankingId(rankingId) {
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    showError('No logged-in user found.');
    return;
  }
  console.log("User email:", user.email);

  const { error } = await supabase
    .from('students')
    .update({ rank_id: rankingId })
    .eq('email', user.email);

  if (error) {
    showError('Failed to update student ranking ID: ' + error.message);
  } else {
    console.log('Student ranking ID updated successfully');
  }
}
// Function to display an alert message styled as a notification
function alertStyled(message) {
  const alertBox = document.createElement('div');
  alertBox.className = 'alert';
  alertBox.textContent = message;
  document.body.prepend(alertBox);
  setTimeout(() => alertBox.remove(), 5000);
}
// Function to pause execution for a specified duration
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}