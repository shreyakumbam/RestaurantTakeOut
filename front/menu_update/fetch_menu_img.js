// Retrieve the image key from localStorage
const imageKey = localStorage.getItem('imageKey');
if (imageKey) {
    document.getElementById('menuImage').src = `http://localhost:3000/image/${encodeURIComponent(imageKey)}`;
    fetchMenuItemDetails(imageKey); // Function to fetch and display menu details
} else {
    document.getElementById('menuImage').alt = 'No image key provided.';
}

function fetchMenuItemDetails(menuItemName) {
    fetch(`http://localhost:3000/menu/${encodeURIComponent(menuItemName)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(details => {
            document.getElementById('menuItemName').textContent = details.menuItemName;
            document.getElementById('price').textContent = `Price: $${details.price}`;
            document.getElementById('allergenDetails').textContent = `Allergens: ${details.allergenDetails}`;
            const ingredients = details.ingredientQuantityMap;
            const ingredientList = document.getElementById('ingredientList');
            ingredientList.innerHTML = ''; // Clear current list

            // Add each ingredient to the list
            for (const [ingredient, quantity] of Object.entries(ingredients)) {
                const li = document.createElement('li');
                li.textContent = `${ingredient}: ${quantity} g`; // Append 'g' after the quantity
                ingredientList.appendChild(li);
            }
        })
        .catch(error => {
            console.error('Error fetching menu details:', error);
        });
}
