// Fetch data button event listener
document.getElementById('fetchDataButton').addEventListener('click', () => {
  console.log('Fetch Data button clicked'); // Debug log
  fetch('http://localhost:4003/api/data') // Correct endpoint
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      console.log('Response received:', response); // Debug log
      return response.json();
    })
    .then((data) => {
      console.log('Data:', data); // Debug log
      const dataContainer = document.getElementById('dataContainer');
      dataContainer.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    })
    .catch((error) => {
      console.error('Error fetching data:', error);
      const dataContainer = document.getElementById('dataContainer');
      dataContainer.innerHTML = `<p style="color: red;">Error fetching data: ${error.message}</p>`;
    });
});

// Debug code button event listener
document.getElementById('debugCodeButton').addEventListener('click', () => {
  const code = document.getElementById('codeInput').value;
  console.log('Debug Code button clicked'); // Debug log
  fetch('http://localhost:3000/debug', {
    // Correct endpoint
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      console.log('Response received:', response); // Debug log
      return response.text();
    })
    .then((result) => {
      console.log('Debug result:', result); // Debug log
      const debugContainer = document.getElementById('debugContainer');
      debugContainer.innerHTML = `<pre>${result}</pre>`;
    })
    .catch((error) => {
      console.error('Error debugging code:', error);
      const debugContainer = document.getElementById('debugContainer');
      debugContainer.innerHTML = `<p style="color: red;">Error debugging code: ${error.message}</p>`;
    });
});

// Generate egg button event listener
document.getElementById('generateEggButton').addEventListener('click', () => {
  const eggOptions = {
    description: 'Test Egg',
    type: 'model',
    options: {
      modelName: 'TestModel',
      fields: [
        { name: 'id', type: 'number' },
        { name: 'name', type: 'string' },
      ],
    },
  };

  console.log('Generate Egg button clicked'); // Debug log
  fetch('http://localhost:3001/api/generate-egg', {
    // Correct endpoint
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eggOptions),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      console.log('Response received:', response); // Debug log
      return response.json();
    })
    .then((result) => {
      console.log('Egg generated:', result); // Debug log
      const eggContainer = document.getElementById('eggContainer');
      eggContainer.innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    })
    .catch((error) => {
      console.error('Error generating egg:', error);
      const eggContainer = document.getElementById('eggContainer');
      eggContainer.innerHTML = `<p style="color: red;">Error generating egg: ${error.message}</p>`;
    });
});

// Monitor dependencies button event listener
document
  .getElementById('monitorDependenciesButton')
  .addEventListener('click', () => {
    console.log('Monitor Dependencies button clicked'); // Debug log
    fetch('http://localhost:3002/api/dependencies') // Correct endpoint
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        console.log('Response received:', response); // Debug log
        return response.json();
      })
      .then((result) => {
        console.log('Dependencies:', result); // Debug log
        const dependenciesContainer = document.getElementById(
          'dependenciesContainer',
        );
        dependenciesContainer.innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
      })
      .catch((error) => {
        console.error('Error monitoring dependencies:', error);
        const dependenciesContainer = document.getElementById(
          'dependenciesContainer',
        );
        dependenciesContainer.innerHTML = `<p style="color: red;">Error monitoring dependencies: ${error.message}</p>`;
      });
  });

// Resolve conflicts button event listener
document
  .getElementById('resolveConflictsButton')
  .addEventListener('click', () => {
    console.log('Resolve Conflicts button clicked'); // Debug log
    fetch('http://localhost:3002/api/dependencies/conflicts') // Correct endpoint
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        console.log('Response received:', response); // Debug log
        return response.json();
      })
      .then((result) => {
        console.log('Resolved conflicts:', result); // Debug log
        const conflictsContainer =
          document.getElementById('conflictsContainer');
        conflictsContainer.innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
      })
      .catch((error) => {
        console.error('Error resolving conflicts:', error);
        const conflictsContainer =
          document.getElementById('conflictsContainer');
        conflictsContainer.innerHTML = `<p style="color: red;">Error resolving conflicts: ${error.message}</p>`;
      });
  });
