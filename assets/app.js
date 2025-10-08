document.getElementById("ask").addEventListener("click", () => {
  const query = document.getElementById("query").value.trim();

  if (!query) {
    alert("Please enter a request, e.g. 'Change the button color to green'");
    return;
  }

  // Check if running inside Figma
  if (window.parent !== window) {
    parent.postMessage(
      { pluginMessage: { type: "nl-command", prompt: query } },
      "*"
    );
    console.log("[Webapp] Sent message to Figma plugin:", query);
  } else {
    console.warn("Not running inside Figma — skipping postMessage.");
    alert("Open this app through your Figma plugin to send commands.");
  }
});
