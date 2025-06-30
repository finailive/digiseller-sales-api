const fs = require("fs");
const path = require("path");
const axios = require("axios");

const affiliateId = "1393244";

// Hàm lọc mô tả, cắt bỏ JSON không mong muốn
function sanitizeDescription(raw) {
  if (!raw) return '';
  const cutoff = raw.indexOf('"image":');
  let clean = cutoff > 0 ? raw.slice(0, cutoff) : raw;
  if (clean.length > 1000) clean = clean.slice(0, 1000) + '...';
  return clean;
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const filePath = path.resolve(process.cwd(), "id.txt");
  let idListRaw;

  try {
    idListRaw = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    return res.status(500).json({ error: "Không đọc được file id.txt", details: err.message });
  }

  const productIds = idListRaw
    .split(/[\s,]+/)
    .map(id => parseInt(id))
    .filter(id => !isNaN(id));

  const products = [];

  await Promise.allSettled(
    productIds.map(async (id) => {
      try {
        const { data } = await axios.get(`https://api.digiseller.com/api/products/${id}/data`, {
          headers: {
            Accept: "application/json",
          },
        });

        if (data?.product?.name) {
          products.push({
            id,
            name: data.product.name,
            price: data.product.price,
            currency: data.product.currency || "USD",
            description: sanitizeDescription(data.product.info),
            image: data.product.preview_imgs?.[0]?.url || "",
            affiliate_link: `https://www.oplata.info/asp2/pay_wm.asp?id_d=${id}&ai=${affiliateId}`,
          });
        }
      } catch (err) {
        // Bỏ qua sản phẩm bị lỗi
      }
    })
  );

  return res.status(200).json(products);
};
