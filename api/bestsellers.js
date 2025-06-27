// /api/bestsellers.js
const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const category = req.query.cat || "activation-keys";

  const categoryMap = {
    "activation-keys": "activation-keys",
    "gift-cards": "gift-cards",
    "software": "software"
  };

  const slug = categoryMap[category];
  if (!slug) {
    return res.status(400).json({ error: "Invalid category" });
  }

  const url = `https://plati.market/best-sellers/${slug}/`;

  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    const products = [];

    $(".product-list .product").each((i, el) => {
      if (i >= 100) return;

      const link = $(el).find(".product__title a").attr("href") || "";
      const name = $(el).find(".product__title").text().trim();
      const priceText = $(el).find(".product__price").text().trim();
      const price = priceText.match(/[\d.,]+/)?.[0] || "";
      const currency = priceText.includes("₽") ? "RUB" : "USD";
      const soldText = $(el).find(".product__extra").text();
      const sold = parseInt(soldText.replace(/\D/g, "")) || 0;
      const image = $(el).find("img").attr("src");
      const idMatch = link.match(/itm\/(\d+)/);
      const id = idMatch ? parseInt(idMatch[1]) : null;
      const seller = $(el).find(".product__seller a").text().trim();

      if (id) {
        products.push({
          id,
          name,
          price,
          currency,
          sold_3m: sold,
          seller,
          image: image?.startsWith("http") ? image : `https://plati.market${image}`
        });
      }
    });

    return res.status(200).json(products);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch bestseller products",
      details: err.message
    });
  }
};
