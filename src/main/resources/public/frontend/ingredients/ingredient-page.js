const BASE_URL = "http://localhost:8081"; // backend URL

// Get references to various DOM elements
const addIngredientNameInput = document.getElementById(
  "add-ingredient-name-input"
);
const deleteIngredientNameInput = document.getElementById(
  "delete-ingredient-name-input"
);
const ingredientListContainer = document.getElementById("ingredient-list");
const adminLink = document.getElementById("admin-link");
let searchInput = document.getElementById("search-input");

// Attach 'onclick' events to buttons
document.getElementById("add-ingredient-submit-button").onclick = addIngredient;
document.getElementById("delete-ingredient-submit-button").onclick =
  deleteIngredient;

let ingredients = [];

// start off with full ingredient list
getIngredients();

/**
 * Function to add a new ingredient to the backend and refresh the list.
 */
async function addIngredient() {
  const name = addIngredientNameInput.value.trim();

  if (name) {
    fetch(`${BASE_URL}/ingredients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + sessionStorage.getItem("auth-token"),
      },
      body: JSON.stringify(name),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to add ingredient.");
      })
      .then(async () => {
        await getIngredients();
        refreshIngredientList(); // Ensure this completes
        const ingredientList = document.getElementById("ingredient-list");
        console.log(
          "Current Ingredient List after refresh:",
          ingredientList.innerHTML
        );
        addIngredientNameInput.value = "";
      })
      .catch((error) => alert(error.message));
  } else {
    alert("Please enter the ingredient name.");
  }
}

async function getIngredients() {
  try {
    const response = await fetch(`${BASE_URL}/ingredients`);
    ingredients = await response.json();
    refreshIngredientList();
  } catch (error) {
    alert("Failed to fetch ingredients: " + error);
  }
}

/**
 * Function to delete a ingredient from the backend and refresh the list.
 */
async function deleteIngredient() {
  const name = deleteIngredientNameInput.value.trim();

  // Find the ID of the ingredient to delete
  let id = null;
  const listItems = ingredientListContainer.getElementsByTagName("li");
  for (let i = 0; i < listItems.length; i++) {
    if (listItems[i].textContent.includes(name)) {
      id = i + 1; // Ensure this matches your backend logic for ID
      break;
    }
  }

  if (!id) {
    alert("Ingredient not found in the list.");
    return;
  }

  try {
    const token = sessionStorage.getItem("auth-token");

    const response = await fetch(`${BASE_URL}/ingredients/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    });

    if (!response.ok)
      throw new Error(`Error deleting ingredient: ${response.statusText}`);

    await getIngredients();
    refreshIngredientList();
    deleteIngredientNameInput.value = "";

    console.log("Ingredient deleted successfully.");
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    alert(error.message);
  }
}

/**
 * Function to fetch and display the list of ingredients from the backend.
 */
function refreshIngredientList() {
  ingredientListContainer.innerHTML = "";

  for (let i = 0; i < ingredients.length; i++) {
    let element = document.createElement("li");
    let ptag = document.createElement("p");
    ptag.innerText = ingredients[i].name;
    element.appendChild(ptag);
    ingredientListContainer.appendChild(element);
  }
}
