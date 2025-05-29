import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://arzbecskqesqesfgmkgu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ';
const supabase = createClient(supabaseUrl, supabaseKey);

window.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('interview-list');

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    container.innerHTML = '<p>Error: No user logged in.</p>';
    return;
  }

  // Get the company record based on user email
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('email', user.email)
    .single();

    console.log('Company data:', company); // Debug output

  if (companyError || !company) {
    container.innerHTML = '<p>Error: Company profile not found.</p>';
    return;
  }

  // Get the company record based on user email
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', company.id)
    

    console.log('Company data:', company); // Debug output
console.log('Job data:', job); // Debug output

  if (companyError || !company) {
    container.innerHTML = '<p>Error: Company profile not found.</p>';
    return;
  }

  // Get interview data using the company's interviewid
  const { data: interview, error: interviewError } = await supabase
    .from('companyInterview')
    .select('*')
    .eq('id', job[1].interview_id)
    .single();
console.log('Interview data:', interview); // Debug output

  if (interviewError || !interview) {
    container.innerHTML = '<p>No interview data found.</p>';
    return;
  }

  
const studentIds = [
  interview.interview1,
  interview.interview2,
  interview.interview3,
];

// Query all matching students in one call
const { data: students, error: studentError } = await supabase
  .from('students')
  .select('student_id, name')
  .in('student_id', studentIds);

if (studentError || !students) {
  console.error('Error fetching student names:', studentError);
  return;
}
console.log('Students data:', students); // Debug output



// Map student_id to name
const idToNameMap = {};
students.forEach(student => {
  idToNameMap[student.student_id] = student.name;
});

// Build the final object
const interviewNameMap = {
  interview1: idToNameMap[interview.interview1] || 'Not Found',
  interview2: idToNameMap[interview.interview2] || 'Not Found',
  interview3: idToNameMap[interview.interview3] || 'Not Found',
};

console.log('Interview name map:', interviewNameMap);




  renderInterviewGroup(interviewNameMap, container);
  renderInterviewGroup(interviewNameMap, container);

});

function renderInterviewGroup(interviewNameMap, container) {
  const groupDiv = document.createElement('div');
  groupDiv.className = 'interview-group';

  ['interview1', 'interview2', 'interview3'].forEach(key => {
    if (interviewNameMap[key]) {
      const div = document.createElement('div');
      div.className = 'interview-card';
      div.textContent = interviewNameMap[key];
      groupDiv.appendChild(div);
    }
  });
  container.appendChild(groupDiv);
}




// Logout handler
document.getElementById('logout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  window.location.href = 'index.html';
});
