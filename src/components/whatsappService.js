export async function sendWhatsAppMessage(submission) {
  const clientId = import.meta.env.VITE_WBIZTOOL_CLIENT_ID;
  const apiKey = import.meta.env.VITE_WBIZTOOL_API_KEY;
  const whatsappClient = import.meta.env.VITE_WBIZTOOL_WHATSAPP_CLIENT;
  const destination = import.meta.env.VITE_WBIZTOOL_DESTINATION;

  if (!clientId || !apiKey || !whatsappClient || !destination) {
    console.warn("WBizTool credentials are not fully configured.");
    return;
  }

  const message = [
    `Employee: ${submission.employee?.name ?? "Unknown"}`,
    `Month: ${submission.monthKey}`,
    `KPI Score: ${submission.scores?.kpiScore ?? 0}`,
    `Learning Score: ${submission.scores?.learningScore ?? 0}`,
    `Relationship Score: ${submission.scores?.relationshipScore ?? 0}`,
    `Overall Score: ${submission.scores?.overall ?? 0}`,
  ].join("\n");

  const payload = {
    client_id: clientId,
    api_key: apiKey,
    whatsapp_client: whatsappClient,
    destination,
    message,
  };

  const response = await fetch("https://wbiztool.com/api/v1/send-message/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WBizTool API error ${response.status}: ${text}`);
  }

  return response.json();
}
