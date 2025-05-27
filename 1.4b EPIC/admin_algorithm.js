import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://arzbecskqesqesfgmkgu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ'; // snip safely, you know what it is
const supabase = createClient(supabaseUrl, supabaseKey)

let array = [];

document.getElementById('run-algo').addEventListener('click', async () => {
  document.getElementById('algo-status').textContent = 'Running algorithm...';
  try {
    await runAlgorithm();
    document.getElementById('algo-status').textContent = 'Algorithm completed successfully!';
  } catch (error) {
    document.getElementById('algo-status').textContent = 'An error occurred while running the algorithm.';
    console.error('Algorithm error:', error);
  }
});

async function runAlgorithm() {
  await fetchResidencyTable();

  const { data: students, error } = await supabase
    .from('student')
    .select(`
      number,
      name,
      class_ranking,
      ranking:rank_id(*)
    `);

if (error) {
  throw new Error('Error fetching students: ' + error.message);
}
  for (const student of students) {
    await processStudent(student);
  }
}

async function fetchResidencyTable() {
  const { data, error } = await supabase
    .from('jobs')
    .select('*');

  if (error) {
    console.error('Error fetching residencies:', error);
    return;
  }

  array = data.map(row => [row.id, row.title, row.residency_number, row.number_of_positions]);
  console.log('Residency table fetched:', array);
}

function residencyExists(residencyName) {
  return array.some(row => row[1] === residencyName);
}

function residencyIndex(residencyName) {
  return array.findIndex(row => row[1] === residencyName);
}

async function processStudent(student) {
  let alloc_count = 0;

  for (let i = 1; alloc_count < 3; i++) {
    const rankKey = `rank${i}`;
    const residency = student.ranking[rankKey];
    if (!residency) continue;

    const exists = residencyExists(residency);
    if (!exists) continue;

    const index = residencyIndex(residency);
    array[index][3] += 1;
    const count = array[index][3];

    if (count <= 3) {
      await manipulate('allocations1', student.number, residency);
      alloc_count++;
    }
  }
}

async function manipulate(table, studentnum, res) {
  const exists = await attributeExists(table, 'id', studentnum);
  if (exists) {
    const isNull = await isAttributeNull(table, 'id', studentnum, 'allo2');
    if (isNull) {
      await updateAttribute(table, 'id', studentnum, 'allo2', res);
    } else {
      await updateAttribute(table, 'id', studentnum, 'allo3', res);
    }
  } else {
    await addEntity(table, studentnum, res);
  }
}

async function attributeExists(tableName, columnName, valueToMatch) {
  const { data, error } = await supabase
    .from(tableName)
    .select(columnName)
    .eq(columnName, valueToMatch)
    .limit(1);

  if (error) {
    console.error('Error checking attribute:', error);
    return false;
  }

  return data.length > 0;
}

async function isAttributeNull(table, key, value, attribute) {
  const { data, error } = await supabase
    .from(table)
    .select(attribute)
    .eq(key, value)
    .single();

  if (error) {
    console.error('Error checking null attribute:', error);
    return false;
  }

  return data?.[attribute] === null;
}

async function addEntity(table, id, allo1Value) {
  const { data, error } = await supabase
    .from(table)
    .insert([{ id: id, allo1: allo1Value }]);

  if (error) {
    console.error('Insert error:', error);
    return false;
  }

  return true;
}

async function updateAttribute(table, matchColumn, matchValue, attribute, newValue) {
  const { data, error } = await supabase
    .from(table)
    .update({ [attribute]: newValue })
    .eq(matchColumn, matchValue);

  if (error) {
    console.error('Update error:', error);
    return false;
  }

  return true;
}
