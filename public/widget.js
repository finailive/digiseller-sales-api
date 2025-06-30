(async () => {
  const API_URL = "https://proxy.smarttravelly.com/api/bestsellers";
  const root = document.getElementById("best-markets-widget");

  if (!root) return;

  // Inject style
  const style = document.createElement("style");
  style.textContent = `
    #best-markets-widget {
      font-family: Arial, sans-serif;
      padding: 1rem;
      max-width: 1200px;
      margin: auto;
    }
    #best-markets-widget .controls {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      margin-bottom: 1rem;
      gap: 1rem;
    }
    #best-markets-widget input, #best-markets-widget select {
      padding: 0.5rem;
      font-size: 1rem;
      width: 100%;
      max-width: 48%;
    }
    #best-markets-widget .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }
    #best-markets-widget .card {
      border: 1px solid #ccc;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      word-break: break-word;
      background: white;
    }
    #best-markets-widget .card img {
      width: 100%;
      height: 160px;
      object-fit: contain;
      margin-bottom: 1rem;
    }
    #best-markets-widget .card h3 {
      font-size: 1rem;
      text-align: center;
      min-height: 48px;
    }
    #best-markets-widget .price {
      font-weight: bold;
      color: #2d2d2d;
    }
    #best-markets-widget .btn {
      margin-top: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      background: #007bff;
      color: white;
      cursor: pointer;
      font-size: 0.9rem;
    }
    #best-markets-widget .btn:hover {
      background: #0056b3;
    }
    #best-markets-widget .description {
      display: none;
      margin-top: 0.5rem;
      font-size: 0.9rem;
      max-height: 200px;
      overflow-y: auto;
    }
    #best-markets-widget .pagination {
      display: flex;
      justify-content: center;
      margin-top: 2rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    #best-markets-widget .pagination button {
      padding: 0.5rem 1rem;
      border: 1px solid #ccc;
      background: #f8f8f8;
      cursor: pointer;
    }
    #best-markets-widget .pagination button.active {
      background: #007bff;
      color: white;
    }
    #favoritesBtn {
      position: fixed;
      top: 100px;
      left: 10px;
      background: #ffc107;
      border: none;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      font-weight: bold;
      cursor: pointer;
      z-index: 1000;
      font-size: 1rem;
    }
    #favoritesList {
      position: fixed;
      top: 160px;
      left: 10px;
      width: 260px;
      background: #fff;
      border: 1px solid #ccc;
      padding: 1rem;
      border-radius: 10px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      display: none;
      z-index: 999;
    }
    #favoritesList ul {
      padding-left: 1rem;
      list-style: disc;
    }
    #favoritesList li {
      margin-bottom: 0.5rem;
    }
  `;
  document.head.appendChild(style);

  // UI setup
  root.innerHTML = `
    <div class="controls">
      <input type="text" id="searchInput" placeholder="Поиск по названию..." />
      <select id="categoryFilter">
        <option value="">Все категории</option>
        <option value="Steam">Steam</option>
        <option value="Windows">Windows</option>
        <option value="Gift">Подарки</option>
        <option value="Card">Карты</option>
        <option value="Account">Аккаунты</option>
      </select>
    </div>
    <div class="grid" id="productGrid"></div>
    <div class="pagination" id="pagination"></div>
    <button id="favoritesBtn">❤ <span id="favoriteCount">0</span></button>
    <div id="favoritesList"><h3>Избранное</h3><ul id="favoriteItems"></ul></div>
  `;

  let products = [], currentPage = 1, favorites = [];
  const itemsPerPage = 12;

  const updateFavorites = () => {
    const list = document.getElementById("favoriteItems");
    const count = document.getElementById("favoriteCount");
    list.innerHTML = "";
    favorites.forEach(p => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${p.affiliate_link}" target="_blank">${p.name}</a>`;
      list.appendChild(li);
    });
    count.textContent = favorites.length;
  };

  const render = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const grid = document.getElementById("productGrid");
    const pagination = document.getElementById("pagination");
    const keyword = document.getElementById("searchInput").value.toLowerCase();
    const category = document.getElementById("categoryFilter").value.toLowerCase();

    let filtered = products.filter(p => {
      return p.name.toLowerCase().includes(keyword) &&
             (!category || p.name.toLowerCase().includes(category));
    });

    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    grid.innerHTML = "";
    pagination.innerHTML = "";

    paginated.forEach(p => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${p.image}" alt="${p.name}" />
        <h3>${p.name}</h3>
        <div class="price">${p.price} ${p.currency}</div>
        <button class="btn toggle-desc">Показать описание</button>
        <div class="description">${p.description || "Нет описания."}</div>
        <a href="${p.affiliate_link}" class="btn" target="_blank">Купить сейчас</a>
        <button class="btn add-fav">❤ В избранное</button>
      `;
      const btns = card.querySelectorAll("button");
      btns[0].onclick = () => {
        const desc = card.querySelector(".description");
        const isShown = desc.style.display === "block";
        desc.style.display = isShown ? "none" : "block";
        btns[0].textContent = isShown ? "Показать описание" : "Скрыть описание";
      };
      btns[2].onclick = () => {
        const exists = favorites.find(f => f.id === p.id);
        if (!exists) favorites.push(p);
        else favorites = favorites.filter(f => f.id !== p.id);
        updateFavorites();
      };
      grid.appendChild(card);
    });

    const pageCount = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > 1) {
      const prev = document.createElement("button");
      prev.textContent = "Назад";
      prev.onclick = () => { currentPage--; render(); };
      pagination.appendChild(prev);
    }

    for (let i = 1; i <= pageCount; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.className = i === currentPage ? "active" : "";
      btn.onclick = () => { currentPage = i; render(); };
      pagination.appendChild(btn);
    }

    if (currentPage < pageCount) {
      const next = document.createElement("button");
      next.textContent = "Вперёд";
      next.onclick = () => { currentPage++; render(); };
      pagination.appendChild(next);
    }
  };

  const data = await fetch(API_URL).then(res => res.json()).catch(() => []);
  products = data.filter(p => p.image);
  render();

  document.getElementById("searchInput").addEventListener("input", () => {
    currentPage = 1;
    render();
  });

  document.getElementById("categoryFilter").addEventListener("change", () => {
    currentPage = 1;
    render();
  });

  document.getElementById("favoritesBtn").addEventListener("click", () => {
    const list = document.getElementById("favoritesList");
    list.style.display = list.style.display === "none" ? "block" : "none";
  });
})();
