/**
 * This script defines the registration functionality for the Registration page in the Recipe Management Application.
 */

// Get references to various DOM elements, such as inputs and the register button, using the document object's `getElementById()` method.
const usernameInput = document.getElementById("username-input");
const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const repeatPasswordInput = document.getElementById("repeat-password-input");
const registerButton = document.getElementById("register-button");

// Ensure the register button has its 'onclick' event associated with the function `processRegistration`.
registerButton.onclick = processRegistration;

/**
 * Function to process user registration.
 *
 * This function does the following:
 * - Retrieves input values for username, email, password, and repeat password.
 * - Verifies that the password matches the repeat password field.
 * - Creates a user object and sends a POST request to the registration endpoint `http://localhost:8081/register`.
 * - Provides feedback to the user:
 *   - On successful registration, redirects to the login page.
 *   - On failure, alerts the user to a registration error.
 *   - If passwords do not match, alerts the user of the mismatch.
 */
async function processRegistration() {
    // Get values from input fields
    const username = usernameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;
    const repeatPassword = repeatPasswordInput.value;

    // Check if passwords match
    if (password !== repeatPassword) {
        alert("Passwords do not match!");
        return;
    }

    // Create the registration object
    const registerBody = { username, email, password };

    // Define the request configuration
    const requestOptions = {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        },
        redirect: "follow",
        referrerPolicy: "no-referrer",
        body: JSON.stringify(registerBody)
    };

    try {
        // Send registration request to the server
        const response = await fetch("http://localhost:8081/register", requestOptions);

        if (response.status === 201) {
            // Registration successful, redirect to login page
            window.location.href = "login-page.html";
        } else if (response.status === 409) {
            // Registration failed, alert the user
            alert("Registration failed: Username or email already exists.");
        } else {
            alert("An error occurred during registration.");
        }
    } catch (error) {
        console.error("Error during registration process:", error);
        alert("An error occurred. Please try again.");
    }
}
