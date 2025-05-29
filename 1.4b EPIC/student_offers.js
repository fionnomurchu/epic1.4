 import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://arzbecskqesqesfgmkgu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ';
const supabase = createClient(supabaseUrl, supabaseKey);

window.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('interview-list');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    container.innerHTML = '<p>Error: No user logged in.</p>';
    return;
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('email', user.email)
    .single();

  if (studentError || !student) {
    container.innerHTML = '<p>Error: Student profile not found.</p>';
    return;
  }

  const { data: interview, error: interviewError } = await supabase
    .from('interview')
    .select('*')
    .eq('id', student.student_id)
    .single();

  if (interviewError || !interview) {
    container.innerHTML = '<p>No interview data found.</p>';
    return;
  }

  ['interview1', 'interview2', 'interview3'].forEach(key => {
    if (interview[key]) {
      const div = document.createElement('div');
      div.className = 'interview-card';
      div.textContent = interview[key];
      container.appendChild(div);
    }
  });
});

document.getElementById('logout').addEventListener('click', async () => {
  await supabase.auth.signOut()
  localStorage.clear()
  window.location.href = 'index.html'
})