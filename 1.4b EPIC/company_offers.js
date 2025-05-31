import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

//create Supabase client instance to interact w Supabase backend
//anon key=JWT(authenticates app for accessing db w public permissions)
const supabaseUrl = 'https://arzbecskqesqesfgmkgu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ';
const supabase = createClient(supabaseUrl, supabaseKey);

window.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('interview-list');

  //verifies logged in user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    container.innerHTML = '<p>Error: No user logged in.</p>';
    return;
  }

  //get the company record based on user email
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

  await loadSelectedStudents(company.id);


  // Get the company record based on user email
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', company.id)
    .eq('has_offer', false);
    

    console.log('Company data:', company); // Debug output
console.log('Job data:', job); // Debug output

  if (companyError || !company) {
    container.innerHTML = '<p>Error: Company profile not found.</p>';
    return;
  }

  for(var i = 0;i<job.length; i++){
  //fetches interview slots for each job
  //handles 3 interview slots per job
  const { data: interview, error: interviewError } = await supabase
    .from('companyInterview')
    .select('*')
    .eq('id', job[i].interview_id)
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

//gets names for all interviewed students
//creates mapping id between ids and names
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

const interviewIdMap = {
  interview1: interview.interview1,
  interview2: interview.interview2,
  interview3: interview.interview3,
};




console.log('Interview name map:', interviewNameMap);




  renderInterviewGroup(interviewNameMap,interviewIdMap, container, job[i].title);

  }
});

const interviewGroups = []; // Stores all interview groups
//creates interactive interview cards
//allows selection of one candidate per job
//groups interviews by job title
function renderInterviewGroup(interviewNameMap,interviewIdMap, container, jobtitle) {
  const groupDiv = document.createElement('div');
  groupDiv.className = 'interview-group';

  const title = document.createElement('h3');
  title.textContent = jobtitle;
  groupDiv.appendChild(title);

  function createSelectableButton(label, studentId) {
    const button = document.createElement('button');
    button.className = 'interview-card';
    button.textContent = label;
    button.dataset.studentId = studentId; // Store the actual student ID


    button.addEventListener('click', () => {
      const buttons = groupDiv.querySelectorAll('.interview-card');
      buttons.forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
    });

    return button;
  }

  // Create and append buttons


  ['interview1', 'interview2', 'interview3'].forEach(key => {
  const name = interviewNameMap[key];
  const id = interviewIdMap[key];
  if (name && id) {
    groupDiv.appendChild(createSelectableButton(name, id));
  }
  });

  container.appendChild(groupDiv);
  interviewGroups.push({ jobtitle, groupDiv }); // Store for later use
}



const submitButton = document.createElement('button');
submitButton.textContent = 'Submit';
submitButton.className = 'submit-button';

submitButton.addEventListener('click', () => {
  const results = [];

  interviewGroups.forEach(({ jobtitle, groupDiv }) => {
    const selected = groupDiv.querySelector('.interview-card.selected');
    results.push({
      jobtitle,
selected: selected ? selected.dataset.studentId : null

    });
  });

  console.log('Selected Interviews:', results);
  // You can now send `results` to a server, show a summary, etc.
 insertInterviewSelections(results);

});

document.getElementById('submit-button').appendChild(submitButton);



//records companys candidate selection
//update job status to reflect offers made
async function insertInterviewSelections(selections) {
  const formattedData = selections
    .filter(item => item.selected !== null)
    .map(item => ({
      student_id: item.selected,
      job_title: item.jobtitle,
    }));

  if (formattedData.length === 0) return;

  const { data, error } = await supabase
    .from('offer')
    .insert(formattedData);

  if (error) {
    console.error('Insert failed:', error);
    return;
  }

  // Update `has_offer` for each job
  for (const item of selections) {
    if (item.selected) {
      await supabase
        .from('jobs')
        .update({ has_offer: true })
        .eq('title', item.jobtitle); // or use job.id if available
    }
  }

  console.log('Insert successful:', data);
  window.location.reload(); // Reload to re-trigger UI filtering
}



async function loadSelectedStudents(companyId) {
  const container = document.getElementById('selected-students');
  container.innerHTML = '<h3>Selected Students</h3>';

  //Step 1: Fetch jobs for this company
  const { data: jobs, error: jobError } = await supabase
    .from('jobs')
    .select('id, title')
    .eq('company_id', companyId);
    

    console.log('Jobs data:', jobs); // Debug output

  if (jobError || !jobs) {
    container.innerHTML += '<p>Error loading jobs.</p>';
    return;
  }

  const jobTitles = jobs.map(job => job.title);

  //Step 2: Fetch all offers for this company's jobs
  const { data: offers, error: offerError } = await supabase
    .from('offer')
    .select('student_id, job_title, accepted')
    .in('job_title', jobTitles);

  if (offerError || !offers.length) {
    container.innerHTML += '<p>No selections found.</p>';
    return;
  }

  const studentIds = offers.map(offer => offer.student_id);

  // Step 3:Get student names
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('student_id, name')
    .in('student_id', studentIds);

  if (studentError) {
    container.innerHTML += '<p>Error loading student names.</p>';
    return;
  }

  const idToName = {};
  students.forEach(s => idToName[s.student_id] = s.name);

  // Step 4:Display offers with color coding
  offers.forEach(offer => {
    const studentName = idToName[offer.student_id] || 'Unknown Student';
    const div = document.createElement('div');
    div.className = 'interview-card';
    div.textContent = `${studentName} — ${offer.job_title}`;

    //Style based on accepted status
    if (offer.accepted === true) {
      div.style.backgroundColor = '#d4edda'; // Green
      div.style.border = '1px solid #28a745';
      div.style.color = '#000000';
    } else if (offer.accepted === false) {
      div.style.backgroundColor = '#f8d7da'; // Red
      div.style.border = '1px solid #dc3545';
      div.style.color = '#000000';
    } else {
      div.style.backgroundColor = '#f0f0f0'; // Gray
      div.style.border = '1px solid #ccc';
      div.style.color = '#000000';
    }

    container.appendChild(div);
  });
}






//Logout handler
document.getElementById('logout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  window.location.href = 'index.html';
});
