(async function () {
  const container = document.getElementById("best-markets-widget");
  if (!container) return;

  const res = await fetch("https://proxy.smarttravelly.com/api/bestsellers");
  const data = await res.json();

  // --- Styles ---
  const style = document.createElement("style");
  style.textContent = `
    #best-markets-widget {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: auto;
      padding: 1rem;
    }
    #best-markets-widget .card {
      border: 1px solid #ccc;
      border-radius: 10px;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    #best-markets-widget .card img {
      max-width: 100%;
      height: 150px;
      object-fit: contain;
      margin-bottom: 0.5rem;
    }
    #best-markets-widget .card h3 {
      font-size: 1rem;
      min-height: 40px;
      margin: 0.5rem 0;
    }
    #best-markets-widget .card .price {
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    #best-markets-widget .card a.buy-btn {
      display: inline-block;
      padding: 0.4rem 1rem;
      background: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-size: 0.9rem;
    }
  `;
  document.head.appendChild(style);

  // --- Render ---
  data.forEach(p => {
    if (!p.image) return; // bỏ sản phẩm không có hình
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <div class="price">${p.price} ${p.currency}</div>
      <a href="${p.affiliate_link}" class="buy-btn" target="_blank">Купить сейчас</a>
    `;
    container.appendChild(card);
  });
})();
