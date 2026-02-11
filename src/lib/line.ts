type LineTextMessage = {
  type: "text";
  text: string;
};

type LinePushPayload = {
  to: string;
  messages: LineTextMessage[];
};

export async function sendLinePush(
  to: string,
  message: string
): Promise<Record<string, unknown>> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not set.");
  }

  const payload: LinePushPayload = {
    to,
    messages: [{ type: "text", text: message }]
  };

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`LINE push failed: ${response.status} ${detail}`);
  }

  return response.json().catch(() => ({}));
}
