// Import Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Supabase project URL and public anon key
const supabaseUrl = 'https://arzbecskqesqesfgmkgu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ'; 

//  Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Retrieve the logged-in student's ID from localStorage
const studentId = localStorage.getItem('student_id');

// If no student ID is found, redirect to the login page
if (!studentId) window.location.href = 'index.html';

// Log-out functionality
document.getElementById('logout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  window.location.href = 'index.html';
});