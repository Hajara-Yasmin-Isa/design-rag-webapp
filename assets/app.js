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

  let res;
  try {
    res = await fetch(BEDROCK_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: query }),
    });
  } catch (networkErr) {
    console.error("[app.js] Network error:", networkErr);
    throw new Error("Could not reach API Gateway / Bedrock endpoint.");
  }

  console.log("[app.js] Raw Bedrock response:", res);

  if (!res.ok) {
    const errText = await res.text();
    console.error("[app.js] Error response body:", errText);
    throw new Error(`Bedrock API failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  console.log("[app.js] Parsed JSON from Bedrock:", data);

  // Support different formats (array, object, or nested in 'commands')
  if (Array.isArray(data.commands)) return data.commands;
  if (Array.isArray(data)) return data;
  if (data.commands) return [data.commands];
  return [data];
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

    resultsEl.textContent = `Created: ${JSON.stringify(parsed, null, 2)}`;
  } catch (e) {
    console.error("[app.js] ERROR:", e);
    resultsEl.textContent = "Error: " + e.message;
  }
});

clearBtn.addEventListener("click", () => {
  queryEl.value = "";
  resultsEl.textContent = "";
});
