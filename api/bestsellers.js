const fs = require("fs");
const path = require("path");
const axios = require("axios");

const affiliateId = "1393244";

module.exports = async (req, res) => {
  // ✅ Thêm CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Đọc danh sách product_id từ file id.txt (cùng thư mục gốc)
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
          headers: { Accept: "application/json" },
        });

        if (data?.product?.name && data.product.preview_imgs?.[0]?.url) {
          products.push({
            id,
            name: data.product.name,
            price: data.product.price,
            currency: data.product.currency || "USD",
            description: data.product.info || "",
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
