// ====== CONFIG ======
const BEDROCK_API_URL =
  "https://1sam4i1dn3.execute-api.us-east-1.amazonaws.com/prod/bedrock";

// ====== UI elements ======
const queryEl = document.getElementById("query");
const resultsEl = document.getElementById("results");
const askBtn = document.getElementById("ask");
const clearBtn = document.getElementById("clear");

// ====== Call Bedrock via API Gateway ======
async function parseCommand(query) {
  console.log("[app.js] Sending to Bedrock:", query);

  const res = await fetch(BEDROCK_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: query }),
  });

  console.log("[app.js] Raw Bedrock response object:", res);

  if (!res.ok) {
    throw new Error(`Bedrock API request failed with status ${res.status}`);
  }

  const data = await res.json();
  console.log("[app.js] Parsed Bedrock JSON:", data);

  // Expect API to return { commands: [...] }
  return data.commands || data;
}

// ====== Event handlers ======
askBtn.addEventListener("click", async () => {
  const query = queryEl.value.trim();
  if (!query) return;

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
});

clearBtn.addEventListener("click", () => {
  queryEl.value = "";
  resultsEl.textContent = "";
});
