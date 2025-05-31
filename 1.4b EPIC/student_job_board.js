// Import Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Initialize Supabase client with project URL and public anon key
const supabase = createClient('https://arzbecskqesqesfgmkgu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ');

// Retrieve the current student's ID from localStorage to ensure they are logged in
const studentId = localStorage.getItem('student_id');
// If no student ID is found, redirect to the login page
if (!studentId) window.location.href = 'index.html';

// Set up the logout button event listener to sign out the user and clear session data
document.getElementById('logout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  window.location.href = 'index.html';
});

// Reference to the HTML div where job liatings will be rendered
const listingsDiv = document.getElementById('job-board-listings');

// Asynchronously fetch job listings from the Supabase 'jobs' table
async function fetchJobs() {
  const { data: jobs, error } = await supabase.from('jobs').select('*');

  // Handle any error that occurs while fetching data
  if (error) {
    alertStyled('Error fetching jobs: ' + error.message);
    return;
  }

  // If there are no jobs available, display a message to the user
  if (!jobs || jobs.length === 0) {
    listingsDiv.innerHTML = '<p>No residencies available at the moment.</p>';
    return;
  }

  // Group jobs by residency number for better UI organisation
  const grouped = {
    R1: [],
    R1R2: [],
    R2: [],
    R3: [],
    R4: [],
    R5: [],
  };

  // Iterate through each job and classify it based on its residency number
  jobs.forEach((job) => {
    const rn = job.residency_number?.toUpperCase().replace(/\s+/g, '');
    if (rn === 'R1') grouped.R1.push(job);
    else if (rn === 'R1+R2' || rn === 'R2+R1') grouped.R1R2.push(job);
    else if (rn === 'R2') grouped.R2.push(job);
    else if (rn === 'R3') grouped.R3.push(job);
    else if (rn === 'R4') grouped.R4.push(job);
    else if (rn === 'R5') grouped.R5.push(job);
  });

  // Clear previous job listings before rendering fresh content
  listingsDiv.innerHTML = '';

  // Render jobs for each grouped residency section
  renderSection('ISE Current Open Residency 1 Positions', grouped.R1);
  renderSection('ISE Current Open Residency 1 + Residency 2 Positions', grouped.R1R2);
  renderSection('ISE Current Open Residency 2 Positions', grouped.R2);
  renderSection('ISE Current Open Residency 3 Positions', grouped.R3);
  renderSection('ISE Current Open Residency 4 Positions', grouped.R4);
  renderSection('ISE Current Open Residency 5 Positions', grouped.R5);
}

// Render a section of job cards for a specific residency category
function renderSection(title, jobs) {
  //Don't render empty sections
  if (!jobs.length) return;

  // Create a new section element for this group
  const section = document.createElement('section');
  section.className = 'job-section';

  // Add a heading with the section title
  const heading = document.createElement('h2');
  heading.textContent = title;
  section.appendChild(heading);

  // Wrapper for job cards
  const wrapper = document.createElement('div');
  wrapper.className = 'job-section-wrapper';

  // Create a card for each job in the list
  jobs.forEach((job) => {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.innerHTML = `
      <h3>${job.title}</h3>
      <p><strong>Location:</strong> ${job.location || 'N/A'}</p>
      <p><strong>Salary:</strong> €${job.monthly_salary || 'N/A'}</p>
      <p><strong>Residency Number:</strong> ${job.residency_number || 'N/A'}</p>
      <p><strong>Contact Email:</strong> <a href="mailto:${job.contact_email}">${job.contact_email}</a></p>
      <p><strong>Accommodation:</strong> ${job.accommodation_support || 'N/A'}</p>
      <p><strong>Special Conditions:</strong> ${job.special_conditions || 'None'}</p>
      <p><strong>Positions Available:</strong> ${job.number_of_positions || 'N/A'}</p>
      <p>${job.description}</p>
    `;
    wrapper.appendChild(card);
  });

  // Append the wrapper to the section and the section to the listings div
  section.appendChild(wrapper);
  listingsDiv.appendChild(section);
}

// Fetch and display jobs when the script loads
fetchJobs();