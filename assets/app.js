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
    label: "Data Display",
    examples: [
      { label: "Data Table", prompt: "Data Table with sorting headers and pagination" },
      { label: "Analytics Chart", prompt: "Bar Chart visual with a legend and tooltips" },
      { label: "Kanban Board", prompt: "Kanban Board with 'To Do', 'In Progress', and 'Done' columns" },
      { label: "Timeline", prompt: "vertical Timeline component for activity logging" },
      { label: "Stat Cards", prompt: "set of Metric/Stat Cards" }
    ]
  },
  {
    label: "Navigation",
    examples: [
      { label: "Sidebar", prompt: "collapsible Sidebar Navigation with icons" },
      { label: "Mega Menu", prompt: "Mega Menu dropdown with multi-column links" },
      { label: "Stepper", prompt: "horizontal Stepper component for a multi-step process" },
      { label: "Breadcrumbs", prompt: "Breadcrumb navigation component" },
      { label: "Tab Bar", prompt: "Tab Bar for switching content views" }
    ]
  },
  {
    label: "Forms & Inputs",
    examples: [
      { label: "Login Screen", prompt: "Login screen" },
      { label: "Signup Screen", prompt: "Signup page" },
      { label: "Settings Form", prompt: "User Settings form with profile and security sections" },
      { label: "Search Bar", prompt: "global Search Bar with autocomplete results" },
      { label: "Wizard", prompt: "multi-step Form Wizard" }
    ]
  },
  {
    label: "Feedback",
    examples: [
      { label: "Success Modal", prompt: "Success Modal with a checkmark icon" },
      { label: "Error Toast", prompt: "Toast Notification for error states" },
      { label: "Empty State", prompt: "Empty State illustration and CTA" },
      { label: "Tooltip", prompt: "set of Tooltip components" }
    ]
  },
  {
    label: "Marketing",
    examples: [
      { label: "Hero Section", prompt: "Hero section with headline and CTA" },
      { label: "Pricing Table", prompt: "3-column Pricing Table" },
      { label: "Testimonials", prompt: "Testimonial slider component" },
      { label: "FAQ", prompt: "Accordion-style FAQ section" },
      { label: "Footer", prompt: "Footer with links and newsletter signup" }
    ]
  },
  {
    label: "Dashboard",
    examples: [
      { label: "Overview Layout", prompt: "full Dashboard Overview layout with sidebar and widgets" },
      { label: "Activity Feed", prompt: "Recent Activity Feed widget" },
      { label: "Profile Card", prompt: "User Profile Card widget" }
    ]
  }
];

// Global Styles / Themes
const styleOptions = [
  { label: "Modern & Clean", prefix: "Create a modern, clean" },
  { label: "Dark Mode", prefix: "Create a dark mode" },
  { label: "Minimalist", prefix: "Create a minimalist, whitespace-heavy" },
  { label: "Wireframe", prefix: "Create a lo-fi wireframe for a" },
  { label: "Corporate Blue", prefix: "Create a professional corporate blue" },
  { label: "Vibrant", prefix: "Create a vibrant, colorful" }
];

// Keywords that trigger suggestions
const triggerKeywords = ["recommend", "suggest", "style", "idea", "template", "page", "help", "login"];

// State
let currentView = 'categories'; // 'categories', 'examples', 'styles'
let selectedCategory = null;
let selectedExample = null;
let selectedStyles = new Set(); // Multi-select state

function renderCategories() {
  currentView = 'categories';
  selectedCategory = null;
  selectedExample = null;
  selectedStyles.clear();
  suggestionsPanel.innerHTML = "";

  suggestionData.forEach(item => {
    const chip = document.createElement("div");
    chip.className = "category-card";
    chip.textContent = item.label;

    chip.addEventListener("click", (e) => {
      e.stopPropagation();
      // Level 1 -> Level 2
      if (item.examples && item.examples.length > 0) {
        renderExamples(item);
      } else {
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
  selectedExample = null;
  selectedStyles.clear();
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
      // Level 2 -> Level 3 (Styles)
      renderStyles(ex);
    });

    suggestionsPanel.appendChild(card);
  });
}

function renderStyles(example) {
  currentView = 'styles';
  selectedExample = example;
  // Don't clear selectedStyles here if we want persistence, 
  // but usually user expects fresh start for new component.
  // Let's clear it for now to avoid confusion.
  selectedStyles.clear();

  suggestionsPanel.innerHTML = "";

  // Back Button (to Examples)
  const backBtn = document.createElement("div");
  backBtn.className = "back-btn";
  backBtn.innerHTML = `← Back to ${selectedCategory.label}`;
  backBtn.onclick = (e) => {
    e.stopPropagation();
    renderExamples(selectedCategory);
  };
  suggestionsPanel.appendChild(backBtn);

  // Header
  const header = document.createElement("div");
  header.style.width = "100%";
  header.style.padding = "4px 8px";
  header.style.fontSize = "12px";
  header.style.color = "#888";
  header.style.marginBottom = "8px";
  header.textContent = `Select styles for "${example.label}" (Optional):`;
  suggestionsPanel.appendChild(header);

  // Container for style chips
  const chipsContainer = document.createElement("div");
  chipsContainer.style.display = "flex";
  chipsContainer.style.flexWrap = "wrap";
  chipsContainer.style.gap = "8px";
  chipsContainer.style.width = "100%";
  suggestionsPanel.appendChild(chipsContainer);

  // Render Style Options
  styleOptions.forEach(style => {
    const card = document.createElement("div");
    card.className = "example-card";
    card.textContent = style.label;

    // Toggle Logic
    card.addEventListener("click", (e) => {
      e.stopPropagation();

      if (selectedStyles.has(style)) {
        selectedStyles.delete(style);
        card.classList.remove("selected");
      } else {
        selectedStyles.add(style);
        card.classList.add("selected");
      }

      // Update Create Button Text
      updateCreateButton();
    });

    chipsContainer.appendChild(card);
  });

  // Create Button
  const createBtn = document.createElement("button");
  createBtn.className = "create-btn";
  createBtn.id = "createBtn";
  createBtn.textContent = `Create ${example.label}`;

  createBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    // 1. Collect prefixes from selected styles
    const prefixes = Array.from(selectedStyles).map(s => s.prefix.replace("Create a ", "").trim());

    // 2. Build Prompt
    let finalPrompt = "";
    if (prefixes.length > 0) {
      // e.g. "Create a modern, clean, dark mode Login Screen..."
      finalPrompt = `Create a ${prefixes.join(", ")} ${example.label} component`;
    } else {
      // Default if no styles selected
      finalPrompt = example.prompt;
    }

    // 3. Visual Feedback & Execute
    queryInput.value = finalPrompt;
    suggestionsPanel.classList.add("hidden");
    submitPrompt(finalPrompt);
  });

  suggestionsPanel.appendChild(createBtn);
}

function updateCreateButton() {
  const btn = document.getElementById("createBtn");
  if (!btn) return;

  const count = selectedStyles.size;
  if (count > 0) {
    btn.textContent = `Create ${selectedExample.label} (${count} styles)`;
  } else {
    btn.textContent = `Create ${selectedExample.label}`;
  }
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
