const askBtn = document.getElementById("ask");
const queryInput = document.getElementById("query");
const statusDiv = document.getElementById("status");
let hideTimeout = null;

askBtn.addEventListener("click", () => {
  const query = queryInput.value.trim();
  if (!query) {
    alert("Please enter a request, e.g. 'Change the button color to green'");
    return;
  }

  const isInFigma = window.parent !== window && !!window.parent.postMessage;

  if (isInFigma) {
    setStatus("Sending request to Figma plugin...", "loading");

    window.parent.postMessage(
      { pluginMessage: { type: "nl-command", prompt: query } },
      "*"
    );

    console.log(`[WebApp → Figma] Sent prompt: "${query}"`);
  } else {
    alert("Please open this web app through your Figma plugin to send commands.");
  }
});

// Listen for messages back from Figma plugin
window.addEventListener("message", (event) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;

  console.log("[Figma → WebApp] Received:", msg);

  if (msg.type === "plugin-ready") {
    setStatus("✅ Figma plugin connected. Ready for commands!", "success", 4000);
  }

  if (msg.type === "status-update") {
    setStatus(msg.text, "loading");
  }

  if (msg.type === "success") {
    setStatus("✅ Changes applied successfully!", "success", 4000);
  }

  if (msg.type === "error") {
    setStatus("❌ Something went wrong — check Figma console.", "error", 6000);
  }
});

// Utility: show and auto-hide status messages
function setStatus(text, state, duration = 0) {
  statusDiv.textContent = text;
  statusDiv.className = `status-message visible ${state}`;

  clearTimeout(hideTimeout);
  if (duration > 0) {
    hideTimeout = setTimeout(() => {
      statusDiv.classList.remove("visible");
    }, duration);
  }
}
