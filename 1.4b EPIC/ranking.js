import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = "https://arzbecskqesqesfgmkgu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const nameList = document.getElementById('nameList');
const errorMessage = document.getElementById('errorMessage');
const positionList = document.getElementById('positionList');

let nameItems = [];
let assignedPositions = new Map();
let jobs = [];

async function fetchJobs() {
  const { data, error } = await supabase.from('jobs').select('*');

  if (error) {
    showError('Failed to fetch job data from Supabase. ' + error.message);
    console.error('Supabase fetch error:', error);
    return;
  }

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

    const nameSpan = document.createElement('span');
    nameSpan.className = 'name-text';
    nameSpan.textContent = job.title;

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'position-input';
    input.placeholder = 'Rank';
    input.dataset.name = job.title;
    input.dataset.previousValue = '';
    input.min = "1";

    input.addEventListener('change', () => updatePositions(input));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') updatePositions(input);
    });

    header.appendChild(toggleBtn);
    header.appendChild(nameSpan);
    header.appendChild(input);

    item.appendChild(header);
    item.appendChild(description);

    nameList.appendChild(item);

    nameItems.push({
      element: item,
      name: job.title,
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
  const name = changedInput.dataset.name;
  const previousValue = changedInput.dataset.previousValue;

  // Remove old assignment if exists
  if (previousValue && assignedPositions.has(parseInt(previousValue))) {
    if (assignedPositions.get(parseInt(previousValue)) === name) {
      assignedPositions.delete(parseInt(previousValue));
      nameItems.forEach(item => {
        if (item.name === name) {
          item.element.classList.remove('highlight');
        }
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
      showError(`Rank ${positionNum} is already assigned to "${assignedPositions.get(positionNum)}"`);
      return;
    }

    assignedPositions.set(positionNum, name);
    changedInput.dataset.previousValue = newValue;

    nameItems.forEach(item => {
      if (item.name === name) {
        item.element.classList.add('highlight');
      }
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
  sortedPositions.forEach(([position, name]) => {
    const job = jobs.find(j => j.title === name);
    html += `
      <div class="position-item">
        <strong>#${position}: ${name}</strong>
        <div style="font-size:0.9em; color:#666; margin-top:2px;">${job?.description || ''}</div>
      </div>
    `;
  });
  html += '</div>';
  positionList.innerHTML = html;
}

window.onload = fetchJobs;
