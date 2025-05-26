import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient('https://arzbecskqesqesfgmkgu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ');

const companyId = localStorage.getItem('company_id');
if (!companyId) window.location.href = 'index.html';

const logoutButton = document.getElementById('logout');
if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = 'index.html';
  });
}

const jobBoard = document.getElementById('company-job-board');

async function fetchCompanyJobs() {
  console.log("Company ID:", companyId);

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', companyId);

  console.log("Fetched jobs:", jobs);

  jobBoard.innerHTML = '';

  if (error) {
    alertStyled('Error fetching jobs: ' + error.message);
    return;
  }

  if (!jobs.length) {
    jobBoard.innerHTML = '<p>No jobs posted yet.</p>';
    return;
  }

  jobs.forEach((job) => {
    const form = document.createElement('form');
    form.className = 'job-card';
    form.dataset.id = job.id;

    form.innerHTML = `
      <label>Title: <input name="title" value="${job.title}" required /></label>
      <label>Description: <textarea name="description" required>${job.description}</textarea></label>
      <label>Residency Number: <input name="residency_number" value="${job.residency_number || ''}" /></label>
      <label>Location: <input name="location" value="${job.location || ''}" /></label>
      <label>Monthly Salary: <input name="monthly_salary" type="number" value="${job.monthly_salary || ''}" /></label>
      <label>Accommodation Support: <input name="accommodation_support" value="${job.accommodation_support || ''}" /></label>
      <label>Special Conditions: <input name="special_conditions" value="${job.special_conditions || ''}" /></label>
      <div class="button-row">
        <button type="submit">Save</button>
        <button type="button" class="delete-button">Remove</button>
      </div>
    `;

    jobBoard.appendChild(form);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const jobId = form.dataset.id;

      const updates = {
        title: formData.get('title'),
        description: formData.get('description'),
        residency_number: formData.get('residency_number'),
        location: formData.get('location'),
        monthly_salary: parseFloat(formData.get('monthly_salary')) || null,
        accommodation_support: formData.get('accommodation_support'),
        special_conditions: formData.get('special_conditions'),
      };

      console.log("Updating job ID:", jobId, updates);

      const { error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId);

      if (error) {
        alertStyled('Update failed: ' + error.message);
      } else {
        alertStyled('Job updated successfully!');
      }
    });

    form.querySelector('.delete-button').addEventListener('click', async () => {
      const confirmed = confirm('Are you sure you want to delete this job?');
      if (!confirmed) return;

      const jobId = form.dataset.id;

      const { error } = await supabase.from('jobs').delete().eq('id', jobId);

      if (error) {
        alertStyled('❌ Error deleting job: ' + error.message);
      } else {
        alertStyled('🗑️ Job deleted');
        fetchCompanyJobs();
      }
    });
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
