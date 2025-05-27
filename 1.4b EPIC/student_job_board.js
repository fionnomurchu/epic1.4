import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient('https://arzbecskqesqesfgmkgu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ');

const studentId = localStorage.getItem('student_id');
if (!studentId) window.location.href = 'index.html';

document.getElementById('logout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  window.location.href = 'index.html';
});

const listingsDiv = document.getElementById('job-board-listings');

async function fetchJobs() {
  const { data: jobs, error } = await supabase.from('jobs').select('*');

  if (error) {
    alertStyled('Error fetching jobs: ' + error.message);
    return;
  }

  if (!jobs || jobs.length === 0) {
    listingsDiv.innerHTML = '<p>No residencies available at the moment.</p>';
    return;
  }

  const grouped = {
    R1: [],
    R1R2: [],
    R2: [],
    R3: [],
    R4: [],
    R5: [],
  };

  jobs.forEach((job) => {
    const rn = job.residency_number?.toUpperCase().replace(/\s+/g, '');
    if (rn === 'R1') grouped.R1.push(job);
    else if (rn === 'R1+R2' || rn === 'R2+R1') grouped.R1R2.push(job);
    else if (rn === 'R3') grouped.R3.push(job);
    else if (rn === 'R4') grouped.R4.push(job);
    else if (rn === 'R5') grouped.R5.push(job);
  });

  listingsDiv.innerHTML = '';
  renderSection('ISE Current Open Residency 1 Positions', grouped.R1);
  renderSection('ISE Current Open Residency 1 + Residency 2 Positions', grouped.R1R2);
  renderSection('ISE Current Open Residency 3 Positions', grouped.R3);
  renderSection('ISE Current Open Residency 4 Positions', grouped.R4);
  renderSection('ISE Current Open Residency 5 Positions', grouped.R5);
}

function renderSection(title, jobs) {
  if (!jobs.length) return;

  const section = document.createElement('section');
  section.className = 'job-section';

  const heading = document.createElement('h2');
  heading.textContent = title;
  section.appendChild(heading);

  const wrapper = document.createElement('div');
  wrapper.className = 'job-section-wrapper';

  jobs.forEach((job) => {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.innerHTML = `
      <h3>${job.title}</h3>
      <p><strong>Location:</strong> ${job.location || 'N/A'}</p>
      <p><strong>Salary:</strong> €${job.monthly_salary || 'N/A'}</p>
      <p><strong>Accommodation:</strong> ${job.accommodation_support || 'N/A'}</p>
      <p><strong>Special Conditions:</strong> ${job.special_conditions || 'None'}</p>
      <p><strong>Positions Available:</strong> ${job.number_of_positions || 'N/A'}</p>
      <p>${job.description}</p>
    `;
    wrapper.appendChild(card);
  });

  section.appendChild(wrapper);
  listingsDiv.appendChild(section);
}
fetchJobs();