
document.getElementById('submission-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const errorMessageDiv = document.getElementById('error-message');
    const successMessageDiv = document.createElement('div');
    const formElement = document.getElementById('submission-form');
    const regSection = document.getElementById('reg-section');
    const successSection = document.getElementById('success-section');

    errorMessageDiv.style.display = 'none';
 
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;    
    const allergies = document.getElementById('allergies').value;
    const organisation = document.getElementById('organisation').value;
    const additional = document.getElementById('additional').value;

    try {
        const response = await fetch('/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, checkIn, checkOut, allergies, organisation, additional }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            errorMessageDiv.style.display = 'block';
            errorMessageDiv.textContent = data.error;
        } else {
            regSection.style.display = 'none';
            successSection.style.display = 'block';               
            formElement.reset();
        }
    } catch (err) {
        errorMessageDiv.style.display = 'block';
        errorMessageDiv.textContent = 'An unexpected error occurred.';
    }
})

document.addEventListener("DOMContentLoaded", function () {
    document.body.style.animation = "fadeIn 2s ease-in-out";

    // Add focus event listeners for checkIn and checkOut fields
    const checkInField = document.getElementById('checkIn');
    const checkOutField = document.getElementById('checkOut');

    checkInField.addEventListener('focus', () => {
        checkInField.placeholder = 'DD-MM-YYYY';
    });

    checkOutField.addEventListener('focus', () => {
        checkOutField.placeholder = 'DD-MM-YYYY';
    });

    // Optionally reset placeholder when focus is lost
    checkInField.addEventListener('blur', () => {
        checkInField.placeholder = 'Hotel Check-in Date';
    });

    checkOutField.addEventListener('blur', () => {
        checkOutField.placeholder = 'Hotel Check-out Date';
    });
});
