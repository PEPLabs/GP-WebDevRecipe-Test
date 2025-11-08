/**
 * This script defines the CRUD operations for Recipe objects in the Recipe Management Application.
 */

const BASE_URL = "http://localhost:8081"; // backend URL

let recipes = [];

// Wait for DOM to fully load before accessing elements
window.addEventListener("DOMContentLoaded", () => {
  // Get references to various DOM elements
  const addRecipeNameInput = document.getElementById("add-recipe-name-input");
  const addRecipeInstructionsInput = document.getElementById(
    "add-recipe-instructions-input"
  );
  const updateRecipeNameInput = document.getElementById(
    "update-recipe-name-input"
  );
  const updateRecipeInstructionsInput = document.getElementById(
    "update-recipe-instructions-input"
  );
  const deleteRecipeNameInput = document.getElementById(
    "delete-recipe-name-input"
  );
  const recipeListContainer = document.getElementById("recipe-list");
  const adminLink = document.getElementById("admin-link");
  const logoutButton = document.getElementById("logout-button");
  let searchInput = document.getElementById("search-input");

  // Show logout button if logged in
  const token = sessionStorage.getItem("auth-token");
  if (token) {
    logoutButton.hidden = false;
  }

  // Show admin link if applicable
  const isAdmin = sessionStorage.getItem("is-admin");
  if (isAdmin === "true") {
    adminLink.hidden = false;
  }

  // Attach event handlers
  document.getElementById("add-recipe-submit-input").onclick = addRecipe;
  document.getElementById("update-recipe-submit-input").onclick = updateRecipe;
  document.getElementById("delete-recipe-submit-input").onclick = deleteRecipe;
  document.getElementById("search-button").onclick = searchRecipes;
  logoutButton.onclick = processLogout;

  // Load initial recipes
  getRecipes();

  // ------------------ Function Definitions ------------------

  async function searchRecipes() {
    recipeListContainer.innerHTML = "";
    try {
      const response = await fetch(
        `${BASE_URL}/recipes?name=${searchInput.value}`,
        {
          method: "GET",
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
        }
      );

      recipes = await response.json();
      refreshRecipeList();
    } catch (error) {
      alert("Search failed: " + error.message);
    }
  }

  async function addRecipe() {
    const name = addRecipeNameInput.value.trim();
    const instructions = addRecipeInstructionsInput.value.trim();

    if (!name || !instructions) {
      alert("Please enter both recipe name and instructions.");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/recipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + sessionStorage.getItem("auth-token"),
        },
        body: JSON.stringify({ name, instructions }),
      });

      if (!response.ok) throw new Error("Failed to add recipe.");

      await getRecipes();
      refreshRecipeList();
      addRecipeNameInput.value = "";
      addRecipeInstructionsInput.value = "";
    } catch (error) {
      alert(error.message);
    }
  }

  async function updateRecipe() {
    const name = updateRecipeNameInput.value.trim();
    const instructions = updateRecipeInstructionsInput.value.trim();

    if (!name || !instructions) {
      alert("Please enter both recipe name and updated instructions.");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/recipes`);
      if (!response.ok) throw new Error("Failed to fetch recipes.");

      const recipeList = await response.json();
      const recipe = recipeList.find((r) => r.name === name);
      if (!recipe) {
        alert("Recipe not found.");
        return;
      }

      const updateResponse = await fetch(`${BASE_URL}/recipes/${recipe.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, instructions }),
      });

      if (!updateResponse.ok) throw new Error("Failed to update recipe.");

      await getRecipes();
      refreshRecipeList();
      updateRecipeNameInput.value = "";
      updateRecipeInstructionsInput.value = "";
    } catch (error) {
      alert(error.message);
    }
  }

  // async function deleteRecipe() {
  //   const name = deleteRecipeNameInput.value.trim();

  //   let id = null;
  //   const listItems = recipeListContainer.getElementsByTagName("li");
  //   for (let i = 0; i < listItems.length; i++) {
  //     if (listItems[i].textContent.includes(name)) {
  //       id = i + 1; // assuming ID maps to list position (adjust if needed)
  //       break;
  //     }
  //   }

  //   if (!id) {
  //     alert("Recipe not found in the list.");
  //     return;
  //   }

  //   try {
  //     const token = sessionStorage.getItem("auth-token");
  //     const response = await fetch(`${BASE_URL}/recipes/${id}`, {
  //       method: "DELETE",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: "Bearer " + token,
  //       },
  //     });

  //     if (!response.ok) throw new Error("Error deleting recipe.");

  //     await getRecipes();
  //     refreshRecipeList();
  //   } catch (error) {
  //     alert(error.message);
  //   }
  // }

  async function deleteRecipe() {
    const name = deleteRecipeNameInput.value.trim();
    const recipe = recipes.find((r) => r.name === name); // ✅ find by name
    if (!recipe) {
      alert("Recipe not found.");
      return;
    }

    try {
      const token = sessionStorage.getItem("auth-token");
      const response = await fetch(`${BASE_URL}/recipes/${recipe.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });

      if (!response.ok) throw new Error("Error deleting recipe.");

      await getRecipes();
      refreshRecipeList();
    } catch (error) {
      alert(error.message);
    }
  }

  async function getRecipes() {
    try {
      const token = sessionStorage.getItem("auth-token");
      const response = await fetch(`${BASE_URL}/recipes`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch recipes.");
      recipes = await response.json();
      refreshRecipeList();
    } catch (error) {
      alert("Failed to fetch recipes: " + error.message);
    }
  }

  // function refreshRecipeList() {
  //   recipeListContainer.innerHTML = "";
  //   for (let i = 0; i < recipes.length; i++) {
  //     let element = document.createElement("li");
  //     let ptag = document.createElement("p");
  //     ptag.innerText = `${recipes[i].name} ${recipes[i].instructions}`;
  //     element.appendChild(ptag);
  //     recipeListContainer.appendChild(element);
  //   }
  // }
  function refreshRecipeList() {
    recipeListContainer.innerHTML = "";
    for (let recipe of recipes) {
      const element = document.createElement("li");
      element.dataset.id = recipe.id; // ✅ store actual recipe ID
      element.innerText = `${recipe.name} ${recipe.instructions}`;
      recipeListContainer.appendChild(element);
    }
  }

  async function processLogout() {
    try {
      const response = await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + sessionStorage.getItem("auth-token"),
        },
      });

      if (response.status === 200) {
        sessionStorage.removeItem("auth-token");
        sessionStorage.removeItem("is-admin");
        setTimeout(() => {
          window.location.href = "../login/login-page.html";
        }, 500);
      } else {
        alert("Failed to log out!");
      }
    } catch (error) {
      alert("Logout error: " + error.message);
    }
  }
});
