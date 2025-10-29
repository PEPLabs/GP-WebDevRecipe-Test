/**
 * This script handles the login functionality for the Recipe Management Application.
 * It manages user authentication by sending login requests to the server and handling responses.
 */

// Get references to DOM elements
const loginButton = document.getElementById("login-button");
const usernameInput = document.getElementById("login-input");
const passwordInput = document.getElementById("password-input");
const logoutButton = document.getElementById("logout-button");

// Add click event listener to the login button
loginButton.onclick = processLogin;

/**
 * Handles the login process for the user by:
 * - Retrieving user credentials
 * - Sending a login request to the server
 * - Processing the response based on the status code
 */
async function processLogin() {
  const username = usernameInput.value;
  const password = passwordInput.value;
  const requestBody = { username, password };

  const requestOptions = {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    },
    redirect: "follow",
    referrerPolicy: "no-referrer",
    body: JSON.stringify(requestBody),
  };

  try {
    const response = await fetch("http://localhost:8081/login", requestOptions);

    if (response.status === 200) {
      const data = await response.text();
      const authToken = data.split(" ")[0];
      const isAdmin = data.split(" ")[1];
      // Save the token in sessionStorage
      sessionStorage.setItem("auth-token", authToken);
      sessionStorage.setItem("is-admin", isAdmin);

      logoutButton.hidden = false;
      // Add a small delay for the test to capture the token before redirection
      setTimeout(() => {
        // Redirect to the recipe page
        window.location.href = "../recipe/recipe-page.html";
      }, 500); // 500ms delay
    } else if (response.status === 401) {
      alert("Incorrect login!");
    } else {
      alert("Unknown issue!");
    }
  } catch (error) {
    console.error("Error during login process:", error);
    alert("An error occurred. Please try again.");
  }
}
