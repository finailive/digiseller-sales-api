export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = "FDA3B085C9F54DF8AF5361209C233549";

  const body = {
    dateFrom: req.body.dateFrom || "2025-05-27",
    dateTo: req.body.dateTo || "2025-06-27",
    lang: "en"
  };

  try {
    const response = await fetch(`https://api.digiseller.com/api/seller-sells/v2?token=${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    const simplified = data.map(p => ({
      productId: p.productId,
      productName: p.productName,
      price: p.price,
      quantity: p.quantity,
      totalAmount: p.totalAmount
    }));

    res.setHeader("Cache-Control", "s-maxage=300");
    return res.status(200).json(simplified);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch from Digiseller", details: err.message });
  }
}
