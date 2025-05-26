import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient('https://arzbecskqesqesfgmkgu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ');

const companyId = localStorage.getItem('company_id');
if (!companyId) {
  window.location.href = 'index.html';
}

document.getElementById('logout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  window.location.href = 'index.html';
});

const jobForm = document.getElementById('job-form');
const companyJobsDiv = document.getElementById('company-jobs');

jobForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const job = {
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    residency_number: document.getElementById('residency_number')?.value.trim() || null,
    location: document.getElementById('location')?.value.trim() || null,
    monthly_salary: parseFloat(document.getElementById('monthly_salary')?.value) || null,
    accommodation_support: document.getElementById('accommodation_support')?.value.trim() || null,
    special_conditions: document.getElementById('special_conditions')?.value.trim() || null,
    company_id: companyId
  };

  console.log('Job being added:', job);

  const { error } = await supabase.from('jobs').insert(job);

  if (error) {
    alertStyled('❌ Error adding job: ' + error.message);
    return;
  }

  alertStyled('Job added successfully!');
  jobForm.reset();
  fetchCompanyJobs(); 
});

async function fetchCompanyJobs() {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', companyId);

  if (error) {
    alertStyled('Error fetching jobs: ' + error.message);
    return;
  }

  companyJobsDiv.innerHTML = '';

  if (jobs.length === 0) {
    companyJobsDiv.innerHTML = '<p>No jobs posted yet.</p>';
    return;
  }

  jobs.forEach((job) => {
    const jobDiv = document.createElement('div');
    jobDiv.innerHTML = `
      <h3>${job.title}</h3>
      <p>${job.description}</p>
    `;
    companyJobsDiv.appendChild(jobDiv);
  });
}

function alertStyled(message) {
  const alertBox = document.createElement('div');
  alertBox.className = 'alert';
  alertBox.textContent = message;
  document.body.prepend(alertBox);
  setTimeout(() => alertBox.remove(), 5000);
}

fetchCompanyJobs();
