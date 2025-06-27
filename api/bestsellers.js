const axios = require("axios");
const cheerio = require("cheerio");

const categoryPaths = {
  "mobile-software": "/cat/mobile-software/125/",
  "social-networks": "/cat/social-networks/24274/",
  "pc": "/cat/pc/121/",
  "game-accounts": "/cat/game-accounts/21940/",
  "cards": "/cat/cards/82795/",
  "itunes-app-store": "/cat/itunes-app-store/19830/"
};

const affiliateId = "1393244";

const domains = ["https://plati.market", "https://plati.io"];

async function tryFetchHTML(path) {
  for (const domain of domains) {
    try {
      const { data } = await axios.get(domain + path, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36"
        }
      });
      return { html: data, domain };
    } catch (err) {
      continue; // Thử domain kế tiếp nếu lỗi
    }
  }
  return { html: null, domain: null };
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cat = req.query.cat;
  const path = categoryPaths[cat];
  if (!path) {
    return res.status(400).json({ error: "Invalid or missing category" });
  }

  const { html, domain } = await tryFetchHTML(path);
  if (!html) {
    return res.status(500).json({ error: "Failed to fetch from both domains" });
  }

  try {
    const $ = cheerio.load(html);
    const products = [];

    $("li.section-list__item > a.card").each((i, el) => {
      if (i >= 100) return;

      const href = $(el).attr("href");
      const idMatch = href?.match(/\/itm\/(\d+)/);
      const id = idMatch ? parseInt(idMatch[1]) : null;
      const name = $(el).find('[name="title"] span').text().trim();
      const priceText = $(el).find('[name="price"]').text().replace(/\s/g, "").trim();
      const currency = priceText.includes("₽") ? "RUB" : "USD";
      const price = priceText.replace(/[^\d.,]/g, "");
      const soldText = $(el).find('[name="sold"]').text();
      const sold = parseInt(soldText.replace(/\D/g, "")) || 0;
      const image = $(el).find("img").attr("src") || "";

      if (id) {
        products.push({
          id,
          name,
          price,
          currency,
          sold_3m: sold,
          image: image.startsWith("http") ? image : `https:${image}`,
          description_api: `https://api.digiseller.com/api/products/${id}/data`,
          affiliate_link: `https://www.oplata.info/asp2/pay_wm.asp?id_d=${id}&ai=${affiliateId}`
        });
      }
    });

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({
      error: "Failed to parse product list",
      details: err.message
    });
  }
};
