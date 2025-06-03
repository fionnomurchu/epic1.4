// Import Supabase client from CDN using ES Module syntax
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Create Supabase client with project URL and public anon key
const supabase = createClient(
  'https://arzbecskqesqesfgmkgu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ'
);

// Login form submission handler
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevent default form submission

  // Get user input values
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;

  // Attempt to log in using Supabase Auth
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (loginError) {
    alertStyled('Login failed: ' + loginError.message);
    return;
  }

   // Handle post-login redirection and profile lookup by role
  if (role === 'student') {
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .single(); // Expect exactly one match

    if (error || !student) {
      alertStyled('Student profile not found.');
      return;
    }

    // Store student ID in localStorage and redirect
    localStorage.setItem('student_id', student.id);
    window.location.href = 'student.html';

  } else if (role === 'company') {
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !company) {
      alertStyled('Company profile not found.');
      return;
    }

    localStorage.setItem('company_id', company.id);
    window.location.href = 'company.html';

  } else if (role === 'admin') {
    const { data: admin, error } = await supabase
      .from('admin')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !admin) {
      alertStyled('Admin profile not found.');
      return;
    }

    localStorage.setItem('admin_id', admin.id);
    window.location.href = 'admin.html';
  }
});

// Role change listener for the registration form
document.getElementById('reg-role')?.addEventListener('change', (e) => {
  const isStudent = e.target.value === 'student';
  document.getElementById('student-fields').style.display = isStudent ? 'block' : 'none';
  document.getElementById('company-fields').style.display = !isStudent ? 'block' : 'none';
});

// Registration form submission handler
document.getElementById('register-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const role = document.getElementById('reg-role').value;

  if (role === 'student') {
    // Extract student credentials
    const email = document.getElementById('student-email').value.trim();
    const password = document.getElementById('student-password').value;

    // Sign up the student using Supabase Auth
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return alertStyled('Registration failed: ' + error.message);

    // Insert student details into 'students' table
    const { error: insertError } = await supabase.from('students').insert({
      name: document.getElementById('student-name').value.trim(),
      student_id: document.getElementById('student-id').value.trim(),
      year: document.getElementById('student-year').value.trim(),
      email
    });

    if (insertError) return alertStyled('Failed to save student profile: ' + insertError.message);
    alertStyled('Student registered successfully!');

  } else if (role === 'company') {
    // Extract company credentials
    const email = document.getElementById('company-email').value.trim();
    const password = document.getElementById('company-password').value;

    // Sign up the company using Supabase Auth
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return alert('Registration failed: ' + error.message);

    // Insert company details into 'companies' table
    const { error: insertError } = await supabase.from('companies').insert({
      name: document.getElementById('company-name').value.trim(),
      email
    });

    if (insertError) return alertStyled('Failed to save company profile: ' + insertError.message);
    alertStyled('Company registered successfully!');
  }
});

function alertStyled(message) {
  const alertBox = document.createElement('div');
  alertBox.className = 'alert';
  alertBox.textContent = message;
  document.body.prepend(alertBox);
  setTimeout(() => alertBox.remove(), 5000);
}