const axios = require("axios");
const cheerio = require("cheerio");

const categoryURLs = {
  "mobile-software": "https://plati.market/cat/mobile-software/125/",
  "social-networks": "https://plati.market/cat/social-networks/24274/",
  "pc": "https://plati.market/cat/pc/121/",
  "game-accounts": "https://plati.market/cat/game-accounts/21940/",
  "cards": "https://plati.market/cat/cards/82795/",
  "itunes-app-store": "https://plati.market/cat/itunes-app-store/19830/"
};

const affiliateId = "1393244";

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cat = req.query.cat;
  const url = categoryURLs[cat];

  if (!url) {
    return res.status(400).json({ error: "Invalid or missing category" });
  }

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36"
      }
    });

    const $ = cheerio.load(html);
    const products = [];

    $(".product-list .product").each((i, el) => {
      if (i >= 100) return;

      const name = $(el).find(".product__title").text().trim();
      const link = $(el).find(".product__title a").attr("href") || "";
      const idMatch = link.match(/\/itm\/(\d+)/);
      const id = idMatch ? parseInt(idMatch[1]) : null;

      const priceText = $(el).find(".product__price").text().trim();
      const price = priceText.match(/[\d.,]+/)?.[0] || "";
      const currency = priceText.includes("₽") ? "RUB" : "USD";

      const soldText = $(el).find(".product__extra").text();
      const sold = parseInt(soldText.replace(/\D/g, "")) || 0;

      const image = $(el).find("img").attr("src") || "";
      const seller = $(el).find(".product__seller a").text().trim();

      if (id) {
        products.push({
          id,
          name,
          price,
          currency,
          sold_3m: sold,
          seller,
          image: image.startsWith("http") ? image : `https://plati.market${image}`,
          description_api: `https://api.digiseller.com/api/products/${id}/data`,
          affiliate_link: `https://www.oplata.info/asp2/pay_wm.asp?id_d=${id}&ai=${affiliateId}`
        });
      }
    });

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch products",
      details: err.message
    });
  }
};
