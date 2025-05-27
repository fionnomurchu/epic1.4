import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://arzbecskqesqesfgmkgu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ'
);

document.getElementById('logout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  window.location.href = 'index.html';
});

document.getElementById('run-algo').addEventListener('click', async () => {
  const status = document.getElementById('algo-status');
  const selectedResidency = document.getElementById('residency-filter').value;

  status.textContent = `⏳ Running algorithm for ${selectedResidency}...`;

  try {
    
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('*')
      .order('qca', { ascending: false });

    if (studentError) throw studentError;

    const { data: rankings, error: rankingsError } = await supabase
      .from('rankings')
      .select('*');

    if (rankingsError) throw rankingsError;

    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, residency_number');

    if (jobsError) throw jobsError;

    const cleanedResidency = selectedResidency.toUpperCase().replace(/\s+/g, '');
    const validJobs = jobs.filter(
      job => job.residency_number?.toUpperCase().replace(/\s+/g, '') === cleanedResidency
    );

    const validJobIds = validJobs.map(job => job.id);
    const jobMap = Object.fromEntries(validJobs.map(job => [job.id, job.title]));

    for (const student of students) {
      const studentRankings = rankings
        .filter(r => r.student_id === student.id && validJobIds.includes(r.job_id))
        .sort((a, b) => a.rank - b.rank)
        .map(r => r.job_id)
        .slice(0, 3);

      if (studentRankings.length === 0) continue;

      const messageBody =
        `You have been allocated interviews for the following ${selectedResidency} residency positions:\n\n` +
        studentRankings.map(id => `• ${jobMap[id]}`).join('\n');

      await supabase.from('messages').insert({
        sender_email: 'admin@ise.ie',
        sender_role: 'admin',
        recipient_email: student.email,
        recipient_role: 'student',
        subject: `Your ${selectedResidency} Residency Interview Allocations`,
        body: messageBody
      });
    }

    status.textContent = `Allocations complete for ${selectedResidency}. Students have been notified.`;

  } catch (err) {
    console.error('Algorithm error:', err);
    status.textContent = 'Algorithm failed. Check console for errors.';
  }
});