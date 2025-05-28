  import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

  const supabaseUrl = 'https://arzbecskqesqesfgmkgu.supabase.co'
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ'; // snip safely, you know what it is
  const supabase = createClient(supabaseUrl, supabaseKey)

  let array = [];

  const residencyMap = {
    "R1, R1+R2": 1,
    "R2": 2,
    "R3": 3,
    "R4": 3,
    "R5": 4
  };


  document.getElementById('run-algo').addEventListener('click', async () => {
    document.getElementById('algo-status').textContent = 'Running algorithm...';
      const select = document.getElementById('residency-filter');
    const selectedValue = select.value;
    const year = residencyMap[selectedValue];
  console.log(selectedValue);  
  console.log(year);
    
    
    try {
      await runAlgorithm(selectedValue, year);
      document.getElementById('algo-status').textContent = 'Algorithm completed successfully!';
    } catch (error) {
      document.getElementById('algo-status').textContent = 'An error occurred while running the algorithm.';
      console.error('Algorithm error:', error);
    }
  });


  async function runAlgorithm(residency_number, year) {
    await fetchResidencyTable(residency_number);


    const { data: students, error } = await supabase
      .from('students')
      .select(`
        name,
        student_id,
        classRank,
        ranking:rank_id(*)
      `)
      .eq('year',year);

  if (error) {
    throw new Error('Error fetching students: ' + error.message);
  }
    console.log('Fetched students:', students); // Debug output
    for (const student of students) {
      await processStudent(student);
    }
  }

  async function fetchResidencyTable(residency_number) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('residency_number', residency_number);

    if (error) {
      console.error('Error fetching residencies:', error);
      return;
    }

    array = data.map(row => [row.id, row.title, row.residency_number, row.number_of_positions,0]);
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
      console.log(`Processing student: ${student.name}, Residency: ${residency}`);
      if (!residency) continue;

      const exists = residencyExists(residency);
      console.log(`Residency exists: ${exists}`);
      if (!exists) continue;


      //problem here
      const index = residencyIndex(residency);
      array[index][4] += 1;
      const count = array[index][4];
      console.log(`Current count for ${residency}: ${count}`);

      if (count <= 3) {
        console.log('manipulating')
        await manipulate('interview', student.student_id, residency);
        alloc_count++;
      }
    }
  }

  async function manipulate(table, studentnum, res) {
    const exists = await attributeExists(table, 'id', studentnum);
    if (exists) {
      const isNull = await isAttributeNull(table, 'id', studentnum, 'interview2');
      if (isNull) {
        await updateAttribute(table, 'id', studentnum, 'interview2', res);
      } else {
        await updateAttribute(table, 'id', studentnum, 'interview3', res);
        await updateAttribute('students', 'student_id', studentnum, 'interviewid', studentnum);
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
      .insert([{ id: id, interview1: allo1Value }]);

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
