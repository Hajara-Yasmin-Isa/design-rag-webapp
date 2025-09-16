// ====== CONFIG ======
const RAG_API_URL =
  "https://87xcd2xj7e.execute-api.us-east-1.amazonaws.com/rico-stage/search";
const BEDROCK_API_URL =
  "https://1sam4i1dn3.execute-api.us-east-1.amazonaws.com/prod/bedrock";
const PAGE_SIZE = 3; // number of results per page

// ====== UI elements ======
const queryEl = document.getElementById("query");
const resultsEl = document.getElementById("results");
const askBtn = document.getElementById("ask");
const clearBtn = document.getElementById("clear");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

// ====== Figma selection bridge (optional) ======
let selectionCache = [];
window.addEventListener("message", (e) => {
  const msg = e.data;
  if (msg?.type === "SELECTION") {
    selectionCache = msg.payload || [];
  }
});

// ====== State for pagination ======
let currentResults = [];
let currentPage = 0;

// ====== Call AWS RAG Lambda ======
async function askRAG(prompt) {
  const dummyVector = [0.12, 0.45, 0.78]; // TODO: swap with real embeddings

  const body = { query_vector: dummyVector };

  const res = await fetch(RAG_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`RAG error ${res.status}`);
  }

  const data = await res.json();
  return JSON.parse(data.body);
}

// ====== Render a page of results ======
function renderPage() {
  resultsEl.innerHTML = "";

  if (!currentResults || currentResults.length === 0) {
    const noneEl = document.createElement("p");
    noneEl.textContent = "(No recommendations found)";
    resultsEl.appendChild(noneEl);
    return;
  }

  const start = currentPage * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, currentResults.length);
  const pageItems = currentResults.slice(start, end);

  pageItems.forEach((item) => {
    const container = document.createElement("div");
    container.style.marginBottom = "20px";

    const title = document.createElement("h4");
    title.textContent = item.source?.title || "(no title)";
    container.appendChild(title);

    if (item.source?.imageUrl) {
      const img = document.createElement("img");
      img.src = item.source.imageUrl;
      img.alt = item.source.title || "image";
      img.style.maxWidth = "200px";
      img.style.display = "block";
      img.style.marginBottom = "5px";
      container.appendChild(img);
    }

    const score = document.createElement("p");
    score.textContent = `Score: ${item.score?.toFixed(2) || "N/A"}`;
    container.appendChild(score);

    resultsEl.appendChild(container);
  });
}

// ====== Call Bedrock via API Gateway ======
async function parseCommand(query) {
  const res = await fetch(BEDROCK_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: query }),
  });

  if (!res.ok) throw new Error("Bedrock API request failed");

  const data = await res.json();
  // Expect data: { shape, color, width, height, text? }
  return data;
}

// ====== Call Bedrock via API Gateway ======
async function parseCommand(query) {
  console.log("[app.js] Sending to Bedrock:", query);

  const res = await fetch(BEDROCK_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: query }),
  });

  console.log("[app.js] Bedrock raw response:", res);

  if (!res.ok) throw new Error("Bedrock API request failed");

  const data = await res.json();
  console.log("[app.js] Parsed Bedrock JSON:", data);

  // Expect data: { shape, color, width, height, text? }
  return data;
}

// ====== Event handlers ======
askBtn.addEventListener("click", async () => {
  const query = queryEl.value.trim();
  if (!query) return;

  if (/create|make|add/i.test(query)) {
    resultsEl.textContent = "Generating on canvas…";

    try {
      const parsed = await parseCommand(query);

      console.log("[app.js] Sending postMessage to plugin:", parsed);

      parent.postMessage(
        { pluginMessage: { type: "create-shape", payload: parsed } },
        "*"
      );

      resultsEl.textContent = `Created: ${JSON.stringify(parsed)}`;
    } catch (e) {
      console.error("[app.js] ERROR:", e);
      resultsEl.textContent = "Error: " + e.message;
    }
    // Fallback: do a normal RAG search
    resultsEl.textContent = "Searching recommendations…";

    try {
      currentResults = await askRAG(query);
      currentPage = 0;
      renderPage();
    } catch (e) {
      console.error("Error in RAG flow:", e);
      resultsEl.textContent = "Error: " + e.message;
    }
  }
});

clearBtn.addEventListener("click", () => {
  queryEl.value = "";
  resultsEl.textContent = "";
  currentResults = [];
  currentPage = 0;
});

nextBtn.addEventListener("click", () => {
  if ((currentPage + 1) * PAGE_SIZE < currentResults.length) {
    currentPage++;
    renderPage();
  }
});

prevBtn.addEventListener("click", () => {
  if (currentPage > 0) {
    currentPage--;
    renderPage();
  }
});
