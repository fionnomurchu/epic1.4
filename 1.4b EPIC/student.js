import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://arzbecskqesqesfgmkgu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ'; 
const supabase = createClient(supabaseUrl, supabaseKey);

const studentId = localStorage.getItem('student_id');
if (!studentId) window.location.href = 'index.html';

document.getElementById('logout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  window.location.href = 'index.html';
});

const jobListingsDiv = document.getElementById('job-listings');

async function fetchJobs() {
  const { data: jobs, error } = await supabase.from('jobs').select('*');
  if (error) return alert('Error fetching jobs: ' + error.message);

  jobListingsDiv.innerHTML = '';
  jobs.forEach((job) => {
    const jobDiv = document.createElement('div');
    jobDiv.classList.add('job-ranking');
    jobDiv.setAttribute('data-id', job.id);
    jobDiv.innerHTML = `
      <h3>${job.title}</h3>
      <p>${job.description}</p>
      <label for="rank-${job.id}">Rank:</label>
      <input type="number" min="1" id="rank-${job.id}" data-job-id="${job.id}" />
    `;
    jobListingsDiv.appendChild(jobDiv);
  });
}

jobListingsDiv.addEventListener('input', () => {
  const jobDivs = Array.from(document.querySelectorAll('.job-ranking'));
  jobDivs.sort((a, b) => {
    const aRank = parseInt(a.querySelector('input').value) || Infinity;
    const bRank = parseInt(b.querySelector('input').value) || Infinity;
    return aRank - bRank;
  });

  jobListingsDiv.innerHTML = '';
  jobDivs.forEach(div => jobListingsDiv.appendChild(div));
});

document.getElementById('submit-rankings').addEventListener('click', async () => {
  if (!confirm('Are you sure you want to submit your rankings?')) return;

  const inputs = jobListingsDiv.querySelectorAll('input[type="number"]');
  const rankings = [];

  inputs.forEach((input) => {
    const jobId = parseInt(input.dataset.jobId);
    const rank = parseInt(input.value);
    if (rank) rankings.push({ job_id: jobId, rank });
  });

  await supabase.from('rankings').delete().eq('student_id', studentId);
  for (const ranking of rankings) {
    await supabase.from('rankings').insert({
      student_id: studentId,
      job_id: ranking.job_id,
      rank: ranking.rank
    });
  }

  alert('Rankings submitted successfully!');
});

fetchJobs();
