export default async function handler(req, res) {
  try {
    const response = await fetch("https://httpbin.org/get");
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
