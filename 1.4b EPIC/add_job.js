//imports createClient func from Supabase JS library
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

//create Supabase client instance to interact w Supabase backend
//anon key=JWT(authenticates app for accessing db w public permissions)
const supabase = createClient(
  'https://arzbecskqesqesfgmkgu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ'
);
//retrieve company_id from browsers localStorage
//localStorage=mechanism that persists data across page reloads
const companyId = localStorage.getItem('company_id');
//if id !valid, user redirected to login page
if (!companyId) window.location.href = 'index.html';
//when logout button pressed, invalidate the access token
document.getElementById('logout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  //redirect to login
  window.location.href = 'index.html';
});

//gets all info inputted in job-form and makes the Add Jobs button act as a submit button
document.getElementById('job-form').addEventListener('submit', async (e) => {
  e.preventDefault();

//creates job object by processing values in html form
//trim used to remove regex
  const job = {
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    residency_number: document.getElementById('residency_number').value.trim(),
    location: document.getElementById('location').value.trim(),
    monthly_salary: parseFloat(document.getElementById('monthly_salary').value) || null,
    contact_email: document.getElementById('contact_email').value.trim(),
    accommodation_support: document.getElementById('accommodation_support').value.trim(),
    special_conditions: document.getElementById('special_conditions').value.trim(),
    number_of_positions: parseInt(document.getElementById('number_of_positions').value),
    company_id: companyId
  };

  //submit 'job' to jobs table in database 
  const { error } = await supabase.from('jobs').insert(job);

  if (error) {
    alertStyled('Failed to add job: ' + error.message);
  } else {
    alertStyled('Job added successfully!');
    document.getElementById('job-form').reset();
  }
});

//function to show temporary error at top of screen fro 5 seconds
function alertStyled(message) {
  const alertBox = document.createElement('div');
  alertBox.className = 'alert';
  alertBox.textContent = message;
  document.body.prepend(alertBox);
  setTimeout(() => alertBox.remove(), 5000);
}
