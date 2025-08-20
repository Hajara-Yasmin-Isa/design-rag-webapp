// ====== CONFIG ======
const API_URL = "https://REPLACE-ME.execute-api.us-east-1.amazonaws.com/prod/rag/query"; // set later

// ====== UI state ======
const queryEl = document.getElementById("query");
const resultsEl = document.getElementById("results");
const askBtn = document.getElementById("ask");
const clearBtn = document.getElementById("clear");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

let lastAnswer = "";
let citations = [];
let selectionCache = []; // received from plugin

// ====== Figma bridge (receive selection) ======
window.addEventListener("message", (e) => {
  const msg = e.data;
  if (msg?.type === "SELECTION") {
    selectionCache = msg.payload || [];
  }
});

// ====== Call your AWS RAG API ======
async function askRAG(prompt) {
  const body = { query: prompt, uiContext: { selection: selectionCache } };
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(`RAG error ${res.status}`);
  }
  return res.json(); // { answer, citations }
}

// ====== UI events ======
askBtn.addEventListener("click", async () => {
  const q = queryEl.value.trim();
  if (!q) return;
  resultsEl.textContent = "Thinking…";
  try {
    const { answer, citations: cits } = await askRAG(q);
    lastAnswer = answer || "";
    citations = cits || [];
    resultsEl.textContent = lastAnswer || "(no answer)";
  } catch (e) {
    resultsEl.textContent = "Error: " + e.message;
  }
});

clearBtn.addEventListener("click", () => {
  queryEl.value = "";
  resultsEl.textContent = "";
});

// demo: send something back to plugin (apply text to first text node)
nextBtn.addEventListener("click", () => {
  const firstText = (selectionCache || []).find(n => n.type === "TEXT");
  if (!firstText) {
    alert("Select a text node in Figma first.");
    return;
  }
  parent.postMessage({ type: "APPLY_TEXT", payload: { nodeId: firstText.id, text: lastAnswer.slice(0, 140) } }, "*");
});

prevBtn.addEventListener("click", () => {
  alert("(You can repurpose ◀ to paginate citations/results.)");
});
