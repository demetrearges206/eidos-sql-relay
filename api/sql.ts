export default async function handler(req, res) {
  console.log("🐛 Handler running");

  if (typeof fetch === "undefined") {
    console.error("❌ fetch is undefined");
    return res.status(500).json({ error: "fetch is not available in this environment" });
  }

  try {
    const response = await fetch("https://httpbin.org/get");
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("❌ fetch threw:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
