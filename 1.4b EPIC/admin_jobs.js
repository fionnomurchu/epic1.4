import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
//create Supabase client instance to interact w Supabase backend
//anon key=JWT(authenticates app for accessing db w public permissions)
const supabase = createClient('https://arzbecskqesqesfgmkgu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ');

//if logout pressed, trigger signOut and clear local storage to invalidate token
//and redirect admin to login page(index.html)
const logout = document.getElementById('logout');
logout?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  window.location.href = 'index.html';
});

//retrieves html elements entered in form to place job
const jobForm = document.getElementById('admin-job-form');
//retrieves html elements to manipulate the jobs list
const jobList = document.getElementById('admin-job-list');

jobForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
//initialise job parameters from form
  const job = {
    company_id: document.getElementById('company-select').value,
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    residency_number: document.getElementById('residency_number').value.trim(),
    location: document.getElementById('location').value.trim(),
    monthly_salary: parseFloat(document.getElementById('monthly_salary').value) || null,
    accommodation_support: document.getElementById('accommodation_support').value.trim(),
    special_conditions: document.getElementById('special_conditions').value.trim(),
    number_of_positions: parseInt(document.getElementById('number_of_positions').value) || 1
  };
//insert job parameters entered in html form to supabase
  const { error } = await supabase.from('jobs').insert(job);
  if (error) {
    alert('Failed to add job: ' + error.message);
  } else {
    alert('Job added!');
    jobForm.reset();
    loadJobs();
  }
});

//fetches company data and populates html dropdown
async function loadCompanies() {
  const { data: companies, error } = await supabase.from('companies').select('id, name');
  const select = document.getElementById('company-select');

  if (error) {
    console.error('Failed to load companies:', error.message);
    return;
  }

  companies.forEach(company => {
    const opt = document.createElement('option');
    opt.value = company.id;
    opt.textContent = company.name;
    select.appendChild(opt);
  });
}
//fetches all jobs from db
async function loadJobs() {
  const { data: jobs, error } = await supabase.from('jobs').select('*').order('title');

  if (error) {
    jobList.innerHTML = '<p>Error loading jobs: ' + error.message + '</p>';
    return;
  }

  if (!jobs || jobs.length === 0) {
    jobList.innerHTML = '<p>No jobs found.</p>';
    return;
  }

  const grouped = {
    R1: [],
    R1R2: [],
    R2: [],
    R3: [],
    R4: [],
    R5: []
  };

  jobs.forEach((job) => {
    //remove regex and make uppercase ie r1 + r2 --> R1+R2
    const rn = job.residency_number?.toUpperCase().replace(/\s+/g, '');
    //checks normalized value and assigns jobs to group
    if (rn === 'R1') grouped.R1.push(job);
    else if (rn === 'R1+R2' || rn === 'R2+R1') grouped.R1R2.push(job);
    else if (rn === 'R2') grouped.R2.push(job);
    else if (rn === 'R3') grouped.R3.push(job);
    else if (rn === 'R4') grouped.R4.push(job);
    else if (rn === 'R5') grouped.R5.push(job);
  });

  //display jobs in html based on group
  jobList.innerHTML = '';
  renderSection('Residency 1 Jobs', grouped.R1);
  renderSection('Residency 1 + 2 Jobs', grouped.R1R2);
  renderSection('Residency 2 Jobs', grouped.R2);
  renderSection('Residency 3 Jobs', grouped.R3);
  renderSection('Residency 4 Jobs', grouped.R4);
  renderSection('Residency 5 Jobs', grouped.R5);
}

function renderSection(title, jobs) {
  //immediately exit if no jobs exist
  if (jobs.length === 0) return;

  //create container "section element"
  const section = document.createElement('section');
  section.className = 'job-section';
  //apply heading for grouped residencies e.g"Residency 4 Jobs"
  const heading = document.createElement('h2');
  heading.textContent = title;
  section.appendChild(heading);

  //create an editable form for each job
  //works with logic from loadJobs func
  jobs.forEach(job => {
    const jobCard = document.createElement('form');
    jobCard.className = 'job-card editable';
    jobCard.dataset.id = job.id;

    jobCard.innerHTML = `
      <label>Title: <input name="title" value="${job.title}" required /></label>
      <label>Description: <textarea name="description">${job.description}</textarea></label>
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
      <label>Salary: <input name="monthly_salary" type="number" value="${job.monthly_salary || ''}" /></label>
      <label>Contact Email: <input name="contact_email" type="email" value="${job.contact_email || ''}" /></label>
      <label>Accommodation: <input name="accommodation_support" value="${job.accommodation_support || ''}" /></label>
      <label>Special Conditions: <input name="special_conditions" value="${job.special_conditions || ''}" /></label>
      <label>No. of Positions: <input name="number_of_positions" type="number" min="1" value="${job.number_of_positions || 1}" /></label>
      <div class="button-row">
        <button type="submit">Save</button>
        <button type="button" class="delete-job">Remove</button>
      </div>
    `;
    //action listener w e.preventDefault to stop page from reloading
    jobCard.addEventListener('submit', async (e) => {
      e.preventDefault();
      ////get job id from card's attribute
      const formData = new FormData(jobCard);
      const jobId = jobCard.dataset.id;
      //update fields
      const update = {
        title: formData.get('title'),
        description: formData.get('description'),
        residency_number: formData.get('residency_number'),
        location: formData.get('location'),
        monthly_salary: parseFloat(formData.get('monthly_salary')) || null,
        contact_email: formData.get('contact_email') || null,
        accommodation_support: formData.get('accommodation_support'),
        special_conditions: formData.get('special_conditions'),
        number_of_positions: parseInt(formData.get('number_of_positions')) || 1
      };

      const { error } = await supabase.from('jobs').update(update).eq('id', jobId);
      if (error) {
        alertStyled('Update failed: ' + error.message);
      } else {
        alertStyled('Job updated successfully');
        loadJobs();//refresh list
      }
    });
    //action listener to delete job
    jobCard.querySelector('.delete-job').addEventListener('click', async () => {
      const confirmed = confirm('Are you sure you want to delete this job?');
      if (!confirmed) return;
      //target job.id to be deleted from supabase
      const { error } = await supabase.from('jobs').delete().eq('id', job.id);
      if (error) {
        alertStyled('Deletion failed: ' + error.message);
      } else {
        alertStyled('Job removed.');
        loadJobs();//refresh list
      }
    });

    section.appendChild(jobCard);//add each job to its category section
  });

  jobList.appendChild(section);//add completed sections to main container
}

loadCompanies();
loadJobs();

function alertStyled(message) {
  const alertBox = document.createElement('div');
  alertBox.className = 'alert';
  alertBox.textContent = message;
  document.body.prepend(alertBox);
  setTimeout(() => alertBox.remove(), 5000);
}