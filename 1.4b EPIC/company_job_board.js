import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
//create Supabase client instance to interact w Supabase backend
//anon key=JWT(authenticates app for accessing db w public permissions)
const supabase = createClient(
  'https://arzbecskqesqesfgmkgu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ'
);
//retrive companyID from local storage(browser)
//if id is invalid, redirect them to login page
const companyId = localStorage.getItem('company_id');
if (!companyId) window.location.href = 'index.html';
//action listener to sign out
const logoutButton = document.getElementById('logout');
logoutButton?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  window.location.href = 'index.html';
});

//store reference to company-job-board element
const jobBoard = document.getElementById('company-job-board');

async function fetchCompanyJobs() {
  //retrieve all job postings for current company logged in
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', companyId);

  //builds editable form for each job
  jobBoard.innerHTML = '';

  if (error) {
    alertStyled('Error fetching jobs: ' + error.message);
    return;
  }

  if (!jobs.length) {
    jobBoard.innerHTML = '<p>No jobs posted yet.</p>';
    return;
  }

  // Custom sort order for residency_number
  const residencyOrder = ['R1', 'R1+R2', 'R2', 'R3', 'R4', 'R5'];
  jobs.sort((a, b) => {
    const indexA = residencyOrder.indexOf(a.residency_number);
    const indexB = residencyOrder.indexOf(b.residency_number);
    return indexA - indexB;
  });

  jobs.forEach((job) => {

    const form = document.createElement('form');
    form.className = 'job-card';
    form.dataset.id = job.id;

    form.innerHTML = `
      <label>Title: <input name="title" value="${job.title}" required /></label>
      <label>Description: <textarea name="description" required>${job.description}</textarea></label>
      <label>Residency Number: 
      <select name="residency_number" required>
      <option value="">-- Select Residency --</option>
      <option value="R1" ${job.residency_number === "R1" ? "selected" : ""}>Residency 1</option>
      <option value="R1+R2" ${job.residency_number === "R1+R2" ? "selected" : ""}>Residency 1 + 2</option>
      <option value="R2" ${job.residency_number === "R2" ? "selected" : ""}>Residency 2</option>
      <option value="R3" ${job.residency_number === "R3" ? "selected" : ""}>Residency 3</option>
      <option value="R4" ${job.residency_number === "R4" ? "selected" : ""}>Residency 4</option>
      <option value="R5" ${job.residency_number === "R5" ? "selected" : ""}>Residency 5</option>
      </select>
      </label>
      <label>Location: <input name="location" value="${job.location || ''}" /></label>
      <label>Monthly Salary: <input name="monthly_salary" type="number" value="${job.monthly_salary || ''}" /></label>
      <label>Contact Email: <input name="contact_email" type="email" value="${job.contact_email || ''}" required /></label>
      <label>Accommodation Support: <input name="accommodation_support" value="${job.accommodation_support || ''}" /></label>
      <label>Special Conditions: <input name="special_conditions" value="${job.special_conditions || ''}" /></label>
      <label>No. of Positions: <input name="number_of_positions" type="number" value="${job.number_of_positions || 1}" min="1" required /></label>
      <div class="button-row">
        <button type="submit">Save</button>
        <button type="button" class="delete-button">Remove</button>
      </div>
    `;

    jobBoard.appendChild(form);
    //collect updated fields using FormData
    //
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
        contact_email: formData.get('contact_email'),
        accommodation_support: formData.get('accommodation_support'),
        special_conditions: formData.get('special_conditions'),
        number_of_positions: parseInt(formData.get('number_of_positions')) || 1
      };
      //send update to supabase
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
    //delete job option
    form.querySelector('.delete-button').addEventListener('click', async () => {
      const confirmed = confirm('Are you sure you want to delete this job?');
      if (!confirmed) return;

      const jobId = form.dataset.id;
      const { error } = await supabase.from('jobs').delete().eq('id', jobId);

      if (error) {
        alertStyled('Error deleting job: ' + error.message);
      } else {
        alertStyled('Job deleted');
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