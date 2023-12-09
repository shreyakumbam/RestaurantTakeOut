function submitForm(event) {
  event.preventDefault();

  const form = event.target;
  const url = form.action;
  const formData = new FormData(form);
  const jsonData = {};

  formData.forEach((value, key) => { jsonData[key] = value; });

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(jsonData)
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(errorData => {
        throw new Error(errorData.message || 'Server responded with a non-OK status');
      });
    }
    return response.json();
  })
  .then(data => {
    if (data.token) {
      // Store the token in localStorage
      localStorage.setItem('jwtToken', data.token);
      // If a token is received, navigate to the new page
      window.location.href = 'menu_update/menu_update.html';
    } else {
      console.log('Success:', data);
      document.getElementById('response').textContent = 'Success! ' + (data.message || 'You are now signed in.');
    }
  })
  .catch((error) => {
    console.error('Error:', error.message);
    document.getElementById('response').textContent = 'Error: ' + error.message;
  });
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('signupForm').addEventListener('submit', submitForm);
  document.getElementById('signinForm').addEventListener('submit', submitForm);
});