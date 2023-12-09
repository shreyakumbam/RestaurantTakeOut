let ingredientCount = 1;

function addIngredient() {
  ingredientCount++;
  if (ingredientCount <= 5) {
    const container = document.getElementById('ingredientsContainer');
    const inputGroup = document.createElement('div');

    inputGroup.innerHTML = `
      <label for="ingredientName${ingredientCount}">Ingredient Name:</label>
      <input type="text" id="ingredientName${ingredientCount}" name="ingredientName${ingredientCount}" required>
      
      <label for="ingredientQuantity${ingredientCount}">Quantity:</label>
      <input type="number" id="ingredientQuantity${ingredientCount}" name="ingredientQuantity${ingredientCount}" required><br><br>
    `;

    container.appendChild(inputGroup);
  } else {
    alert('You can only add up to 5 ingredients.');
  }
}

function sendPostRequest(event) {
  event.preventDefault();

  // Retrieve the token from local storage
  const token = localStorage.getItem('jwtToken');

  // Check if the token exists
  if (!token) {
    console.error('No JWT token found. Please sign in.');
    // Optionally, redirect the user to the sign-in page or show an error message
    return;
  }

  const formData = {
    menuItemName: document.getElementById('menuItemName').value,
    price: parseFloat(document.getElementById('price').value),
    allergenDetails: document.getElementById('allergenDetails').value,
    ingredientQuantityMap: {}
  };

  for (let i = 1; i <= ingredientCount; i++) {
    const ingredientName = document.getElementById(`ingredientName${i}`).value;
    const ingredientQuantity = parseInt(document.getElementById(`ingredientQuantity${i}`).value, 10);
    if (ingredientName) {
      formData.ingredientQuantityMap[ingredientName] = ingredientQuantity;
    }
  }
  console.log('Form submission data:', formData);

  fetch('http://localhost:3000/manager/menu', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Add the token to the Authorization header
    },
    body: JSON.stringify(formData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(` status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => console.log('Response data:', data))
  .catch((error) => {
    console.error('Error Heyhey:', error.message);
    document.getElementById('response').textContent = 'Error: ' + error.message;
  });
}


// Attach event listeners when the window loads
document.getElementById('updateForm').addEventListener('submit', sendPostRequest);
document.getElementById('addIngredient').addEventListener('click', addIngredient);
