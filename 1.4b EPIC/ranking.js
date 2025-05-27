
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = "https://arzbecskqesqesfgmkgu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const nameList = document.getElementById('nameList');
const errorMessage = document.getElementById('errorMessage');
const positionList = document.getElementById('positionList');
const residencySelect = document.getElementById('residencySelect');

let nameItems = [];
let assignedPositions = new Map();
let jobs = [];

document.getElementById('logout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  window.location.href = 'index.html';
});

async function fetchJobs() {
  const { data, error } = await supabase.from('jobs').select('*');
  if (error) return showError('Failed to fetch job data from Supabase. ' + error.message);
  jobs = data;
  initializeList();
}

function initializeList() {
  nameList.innerHTML = '';
  nameItems = [];
  assignedPositions.clear();
  errorMessage.style.display = 'none';
  updatePositionDisplay();

  jobs.forEach((job) => {
    const item = document.createElement('div');
    item.className = 'name-item';

    const header = document.createElement('div');
    header.className = 'name-header';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-description';
    toggleBtn.innerHTML = '&#9654;';

    const description = document.createElement('div');
    description.className = 'description';
    description.innerHTML = `
      <strong>Description:</strong> ${job.description || 'N/A'}<br>
      <strong>Location:</strong> ${job.location || 'N/A'}<br>
      <strong>Salary:</strong> €${job.monthly_salary || 'N/A'}<br>
      <strong>Accommodation:</strong> ${job.accommodation_support || 'N/A'}<br>
      <strong>Special Conditions:</strong> ${job.special_conditions || 'None'}
    `;

    toggleBtn.addEventListener('click', () => toggleDescription(toggleBtn, description));

    const nameHeading = document.createElement('h3');
    nameHeading.className = 'name-text';
    nameHeading.textContent = job.title;

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

    nameItems.push({
      element: item,
      name: job.title,
      id: job.id,
      input,
      description,
      toggleBtn
    });
  });
}

function toggleDescription(button, description) {
  const isVisible = description.classList.toggle('visible');
  button.classList.toggle('rotated', isVisible);
}

function updatePositions(changedInput) {
  errorMessage.style.display = 'none';
  const newValue = changedInput.value;
  const jobId = changedInput.dataset.jobId;
  const previousValue = changedInput.dataset.previousValue;

  if (previousValue && assignedPositions.has(parseInt(previousValue))) {
    if (assignedPositions.get(parseInt(previousValue)) === jobId) {
      assignedPositions.delete(parseInt(previousValue));
      nameItems.forEach(item => {
        if (item.id === jobId) item.element.classList.remove('highlight');
      });
    }
  }

  if (newValue !== '') {
    const positionNum = parseInt(newValue);

    if (isNaN(positionNum) || positionNum < 1) {
      showError("Please enter a positive number");
      changedInput.value = '';
      changedInput.dataset.previousValue = '';
      updatePositionDisplay();
      return;
    }

    if (assignedPositions.has(positionNum)) {
      changedInput.value = previousValue || '';
      showError(`Rank ${positionNum} is already assigned to another job.`);
      return;
    }

    assignedPositions.set(positionNum, jobId);
    changedInput.dataset.previousValue = newValue;

    nameItems.forEach(item => {
      if (item.id === jobId) item.element.classList.add('highlight');
    });
  } else {
    changedInput.dataset.previousValue = '';
  }

  updatePositionDisplay();
  sortList();
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

function sortList() {
  const itemsWithPositions = nameItems.map(item => {
    const position = parseInt(item.input.value);
    return {
      ...item,
      position: isNaN(position) ? Infinity : position
    };
  });

  itemsWithPositions.sort((a, b) => a.position - b.position);
  nameList.innerHTML = '';
  itemsWithPositions.forEach(item => nameList.appendChild(item.element));
}

function updatePositionDisplay() {
  if (assignedPositions.size === 0) {
    positionList.innerHTML = '<p>No rankings assigned yet</p>';
    return;
  }

  const sortedPositions = Array.from(assignedPositions.entries()).sort((a, b) => a[0] - b[0]);

  let html = '<div>';
  sortedPositions.forEach(([position, jobId]) => {
    const job = jobs.find(j => j.id === jobId);
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

async function fetchResidencies() {
  const { data, error } = await supabase
    .from('jobs')
    .select('residency_number', { count: 'exact', distinct: true });

  if (error) {
    showError('Failed to fetch residencies. ' + error.message);
    return;
  }

  const uniqueResidencies = [...new Set(data.map(row => row.residency_number))];
  residencySelect.innerHTML = `<option value="">-- Select Residency --</option>`;
  uniqueResidencies.forEach(res => {
    if (res) {
      const option = document.createElement('option');
      option.value = res;
      option.textContent = res;
      residencySelect.appendChild(option);
    }
  });
}

residencySelect.addEventListener('change', () => {
  const selectedResidency = residencySelect.value;
  if (selectedResidency) {
    fetchJobsByResidency(selectedResidency);
  } else {
    nameList.innerHTML = '';
    positionList.innerHTML = '';
  }
});

async function fetchJobsByResidency(residency) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('residency_number', residency);

  if (error) {
    showError('Failed to fetch jobs for this residency. ' + error.message);
    return;
  }

  jobs = data;
  initializeList();
}

document.getElementById('submitRankingBtn').addEventListener('click', async () => {
  const ranks = [];
  let residencyValue = null;

  document.querySelectorAll('#positionList .position-item').forEach((item, index) => {
    const title = item.getAttribute('data-job-title');
    const residency = item.getAttribute('data-residency');

    if (title) {
      ranks[index] = title;
    } else {
      ranks[index] = null;
    }

    if (index === 0 && residency) {
      residencyValue = residency;
    }
  });

  const payload = {
    rank1: ranks[0] || null,
    rank2: ranks[1] || null,
    rank3: ranks[2] || null,
    rank4: ranks[3] || null,
    rank5: ranks[4] || null,
    rank6: ranks[5] || null,
    rank7: ranks[6] || null,
    rank8: ranks[7] || null,
    rank9: ranks[8] || null,
    residency: residencyValue || null
  };

  console.log("Submitting payload:", payload);

  const { data, error } = await supabase
    .from('ranking')
    .insert([payload])
    .select('id')   // This tells Supabase to return the `id` field
    .single();      // This ensures you get a single object instead of an array
  if (error) {
    showError('Error submitting rankings: ' + error.message);
  } else {
      const insertedRankingId = data.id;
    console.log('Inserted ranking ID:', insertedRankingId);
    await updateStudentRankingId(insertedRankingId);
    alert('Rankings submitted successfully!');
  }



});

window.onload = async () => {
  await fetchResidencies();
};



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
    .eq('email', user.email); // Match on email instead of user ID

  if (error) {
    showError('Failed to update student ranking ID: ' + error.message);
  } else {
    console.log('Student ranking ID updated successfully');
  }
}
