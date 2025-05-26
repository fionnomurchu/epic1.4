import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient('https://arzbecskqesqesfgmkgu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ');
const companyId = localStorage.getItem('company_id');
if (!companyId) window.location.href = 'index.html';

document.getElementById('logout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  window.location.href = 'index.html';
});

document.getElementById('job-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const job = {
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    residency_number: document.getElementById('residency_number').value.trim(),
    location: document.getElementById('location').value.trim(),
    monthly_salary: parseFloat(document.getElementById('monthly_salary').value) || null,
    accommodation_support: document.getElementById('accommodation_support').value.trim(),
    special_conditions: document.getElementById('special_conditions').value.trim(),
    company_id: companyId
  };

  const { error } = await supabase.from('jobs').insert(job);

  if (error) {
    alertStyled('Failed to add job: ' + error.message);
  } else {
    alertStyled('Job added successfully!');
    document.getElementById('job-form').reset();
  }
});

function alertStyled(message) {
  const alertBox = document.createElement('div');
  alertBox.className = 'alert';
  alertBox.textContent = message;
  document.body.prepend(alertBox);
  setTimeout(() => alertBox.remove(), 5000);
}
