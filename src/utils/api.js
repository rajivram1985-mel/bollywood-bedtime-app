export async function generateStory(movieName, ageRange = "6-8", language = "en") {
  const res = await fetch("/.netlify/functions/generate-story", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ movieName, ageRange, language }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error || "Failed to generate story");
  }

  // Read Anthropic's SSE stream and accumulate text_delta events.
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload) continue;

      let event;
      try {
        event = JSON.parse(payload);
      } catch {
        continue;
      }

      if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
        text += event.delta.text;
        // Early-abort if the model signalled an unrecognised film. The marker
        // arrives within the first ~12 chars, so we can stop as soon as we
        // have enough text to rule it out.
        if (text.length >= 12 && text.trimStart().startsWith("NOT_A_FILM:")) {
          await reader.cancel().catch(() => {});
          // Wait briefly for the reason to finish streaming, then throw.
          // If the reason hasn't arrived yet, fall back to a generic message.
          const reason = text.replace(/^\s*NOT_A_FILM:\s*/, "").trim();
          throw new Error(reason || "That doesn't look like a Bollywood film I recognise. Double-check the spelling and try again.");
        }
      } else if (event.type === "error") {
        throw new Error(event.error?.message || "Streaming error");
      }
    }
  }

  if (text.trimStart().startsWith("NOT_A_FILM:")) {
    const reason = text.replace(/^\s*NOT_A_FILM:\s*/, "").trim();
    throw new Error(reason || "That doesn't look like a Bollywood film I recognise. Double-check the spelling and try again.");
  }

  if (!text) throw new Error("No story generated");
  return text;
}
