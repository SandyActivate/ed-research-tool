exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  var body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON: " + e.message }) };
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "API key not found in environment variables" }) };
  }

  var response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: body.system,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: body.messages
      })
    });
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: "Fetch to Anthropic failed: " + e.message }) };
  }

  var text = await response.text();

  var data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: "Anthropic returned non-JSON: " + text.substring(0, 300) }) };
  }

  return {
    statusCode: response.status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };
};
