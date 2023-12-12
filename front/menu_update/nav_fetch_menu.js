document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('fetchForm');

    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission

        const key = document.getElementById('key').value;
        localStorage.setItem('imageKey', key);
        
        // Correct the path according to your directory structure
        window.location.href = `menu_fetch.html`;
    });
});
