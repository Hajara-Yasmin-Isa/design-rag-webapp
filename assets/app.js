document.getElementById("ask").addEventListener("click", () => {
  const query = document.getElementById("query").value.trim();

  if (!query) {
    alert("Please enter a request, e.g. 'Change the button color to green'");
    return;
  }

  // Check if running inside Figma
  if (window.parent !== window) {
    // Include pluginId in the message so Figma accepts it
    parent.postMessage(
      {
        pluginMessage: { type: "nl-command", prompt: query },
        pluginId: "*", // 👈 allow message to go to any Figma plugin (safe here)
      },
      "*"
    );

    console.log("[Webapp] Sent message to Figma plugin:", query);
  } else {
    console.warn("Not running inside Figma — skipping postMessage.");
    alert("Open this app through your Figma plugin to send commands.");
  }
});

// Suggestions Logic
const suggestionsPanel = document.getElementById("suggestions");
const queryInput = document.getElementById("query");

// Data Structure: Categories -> Examples (Strict Text Only)
const suggestionData = [
  {
    label: "Landing Page",
    examples: [
      { label: "SaaS Startup", prompt: "Create a modern SaaS Landing Page" },
      { label: "Mobile App", prompt: "Create a Mobile App Landing Page" },
      { label: "Agency", prompt: "Create a creative Agency Landing Page" },
      { label: "Course", prompt: "Create an Online Course Landing Page" }
    ]
  },
  {
    label: "Dashboard",
    examples: [
      { label: "Analytics", prompt: "Create a detailed Analytics Dashboard" },
      { label: "CRM", prompt: "Create a CRM Dashboard interface" },
      { label: "E-commerce", prompt: "Create an E-commerce Admin Dashboard" }
    ]
  },
  {
    label: "Login Flow",
    examples: [
      { label: "Simple Login", prompt: "Design a clean, minimal Login screen" },
      { label: "Social Login", prompt: "Design a Login screen with Social Media buttons" },
      { label: "Split Screen", prompt: "Design a split-screen Login page with image" }
    ]
  },
  {
    label: "Mobile App",
    examples: [
      { label: "Profile", prompt: "Design a User Profile screen" },
      { label: "Feed", prompt: "Design a Social Media Feed screen" },
      { label: "Settings", prompt: "Design a Mobile App Settings screen" }
    ]
  },
  { label: "Portfolio", examples: [] },
  { label: "E-commerce", examples: [] },
  { label: "Contact Us", examples: [] },
  { label: "Pricing", examples: [] }
];

// Keywords that trigger suggestions
const triggerKeywords = ["recommend", "suggest", "style", "idea", "template", "page", "help", "login"];

// State
let currentView = 'categories'; // 'categories' or 'examples'
let selectedCategory = null;

function renderCategories() {
  currentView = 'categories';
  selectedCategory = null;
  suggestionsPanel.innerHTML = "";

  suggestionData.forEach(item => {
    const chip = document.createElement("div");
    chip.className = "category-card";
    chip.textContent = item.label;

    chip.addEventListener("click", (e) => {
      e.stopPropagation();
      // DO NOT update input prompt here per user request.

      if (item.examples && item.examples.length > 0) {
        renderExamples(item);
      } else {
        // Direct execution if no examples
        submitPrompt(`Create a ${item.label}`);
        suggestionsPanel.classList.add("hidden");
      }
    });

    suggestionsPanel.appendChild(chip);
  });
}

function renderExamples(category) {
  currentView = 'examples';
  selectedCategory = category;
  suggestionsPanel.innerHTML = "";

  // Back Button
  const backBtn = document.createElement("div");
  backBtn.className = "back-btn";
  backBtn.innerHTML = "← Back to Categories";
  backBtn.onclick = (e) => {
    e.stopPropagation();
    renderCategories();
  };
  suggestionsPanel.appendChild(backBtn);

  // Render Examples
  category.examples.forEach(ex => {
    const card = document.createElement("div");
    card.className = "example-card";
    card.textContent = ex.label; // text only

    card.addEventListener("click", (e) => {
      e.stopPropagation();
      // Visual feedback
      queryInput.value = ex.prompt;
      suggestionsPanel.classList.add("hidden");

      // Auto-Execute!
      submitPrompt(ex.prompt);
    });

    suggestionsPanel.appendChild(card);
  });
}

function submitPrompt(text) {
  console.log("Submitting:", text);
  // Send to Figma if in plugin mode, or just log/alert if standalone
  if (window.parent && window.parent.postMessage) {
    window.parent.postMessage(
      {
        pluginMessage: { type: "nl-command", prompt: text },
        pluginId: "*", // or specific ID if known
      },
      "*"
    );
  }
}

// Render initially
renderCategories();

queryInput.addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();
  const hasKeyword = triggerKeywords.some(keyword => value.includes(keyword));

  if (hasKeyword) {
    suggestionsPanel.classList.remove("hidden");
    // Ensure we are showing categories if the user is just starting valid input
    if (currentView === 'examples' && !selectedCategory) {
      renderCategories();
    }
  } else {
    suggestionsPanel.classList.add("hidden");
  }
});

// Hide suggestions when clicking outside
document.addEventListener("click", (e) => {
  if (!suggestionsPanel.contains(e.target) && e.target !== queryInput) {
    suggestionsPanel.classList.add("hidden");
  }
});
