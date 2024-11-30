document.getElementById('submission-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const errorMessageDiv = document.getElementById('error-message');
    const successMessageDiv = document.createElement('div');
    const formElement = document.getElementById('submission-form');

    errorMessageDiv.style.display = 'none';

    const name = document.getElementById('name').value;
    const role = document.getElementById('role').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, role, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            errorMessageDiv.style.display = 'block';
            errorMessageDiv.textContent = data.error;
        } else {
            // Hide and reset the form
            formElement.reset();
            formElement.style.display = 'none';

            // Show the success message
            successMessageDiv.textContent = data.message;
            successMessageDiv.classList.add('success-message'); // Add the CSS class
            formElement.parentNode.appendChild(successMessageDiv); // Add success message to the page
        }
    } catch (err) {
        errorMessageDiv.style.display = 'block';
        errorMessageDiv.textContent = 'An unexpected error occurred.';
    }
})