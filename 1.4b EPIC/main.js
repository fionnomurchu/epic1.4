import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://arzbecskqesqesfgmkgu.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ'; 
const supabase = createClient(supabaseUrl, supabaseKey);

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;

  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (loginError) {
    alert('Login failed: ' + loginError.message);
    return;
  }

  if (role === 'student') {
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      alert('Student profile not found');
      return;
    }

    localStorage.setItem('student_id', student.id);
    window.location.href = 'student.html';
  } else {
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      alert('Company profile not found');
      return;
    }

    localStorage.setItem('company_id', company.id);
    window.location.href = 'company.html';
  }
});
document.getElementById('reg-role').addEventListener('change', (e) => {
  document.getElementById('student-fields').style.display = e.target.value === 'student' ? 'block' : 'none';
  document.getElementById('company-fields').style.display = e.target.value === 'company' ? 'block' : 'none';
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const role = document.getElementById('reg-role').value;

  if (role === 'student') {
    const email = document.getElementById('student-email').value.trim();
    const password = document.getElementById('student-password').value;
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return alert(error.message);

    await supabase.from('students').insert({
      name: document.getElementById('student-name').value,
      student_id: document.getElementById('student-id').value,
      year: document.getElementById('student-year').value,
      email
    });

    alert('Student registered!');
  } else {
    const email = document.getElementById('company-email').value.trim();
    const password = document.getElementById('company-password').value;
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return alert(error.message);

    await supabase.from('companies').insert({
      name: document.getElementById('company-name').value,
      email
    });

    alert('Company registered!');
  }
});

