document.getElementById("ask").addEventListener("click", () => {
  const query = document.getElementById("query").value;
  parent.postMessage({ pluginMessage: { type: "nl-command", prompt: query } }, "*");
});
