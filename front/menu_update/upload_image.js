const imageForm = document.querySelector("#imageForm");
const imageInput = document.querySelector("#imageInput");
const imageNameInput = document.querySelector("#imageNameInput"); // New input for image name

imageForm.addEventListener("submit", async event => {
  event.preventDefault();
  const file = imageInput.files[0];
  const imageName = imageNameInput.value; // Get the image name from the input

  if (!file || !imageName) {
    alert('Please select a file and enter an image name.');
    return;
  }

  // Object to hold the image name
  const requestData = {
    imageName: imageName
  };

  // Fetch the presigned URL from your server
  const fetchResponse = await fetch("/s3Url", {
    method: "POST", // You might need to change this method to POST if not already done
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestData) // Send the image name along with the request
  });

  if (!fetchResponse.ok) {
    alert('Failed to get the presigned URL.');
    return;
  }

  const { url } = await fetchResponse.json(); //generage temporary url to access S3 bucket
  console.log(url);

  // Use the URL to upload the file to S3
  const uploadResponse = await fetch(url, {
    method: "PUT",
    body: file
  });

  if (!uploadResponse.ok) {
    alert('Failed to upload image.');
    return;
  }

  const imageUrl = url.split('?')[0];
  console.log(imageUrl);
});