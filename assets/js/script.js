(function () {
  "use strict";

  const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const page = document.body.dataset.page || "home";
  const adminPage = document.body.dataset.admin || "";

  let foods = [];
  let categoryRecords = [];
  let categories = ["All"];
  let currentPage = 1;
  const perPage = 6;

  function authToken() {
    return localStorage.getItem("foodflow_token") || "";
  }

  async function api(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };
    const token = authToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(path, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }
    return data;
  }

  async function loadFoods() {
    try {
      const [foodRows, categoryRows] = await Promise.all([
        api("/api/foods"),
        api("/api/categories")
      ]);
      foods = Array.isArray(foodRows) ? foodRows : [];
      categoryRecords = Array.isArray(categoryRows) ? categoryRows : [];
    } catch (error) {
      foods = [];
      categoryRecords = [];
      toast("Could not load MongoDB menu data");
    }
    categories = ["All", ...new Set(foods.map(food => food.category))];
  }

  function storageGet(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (error) { return fallback; }
  }

  function storageSet(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getCart() {
    return storageGet("foodflow_cart", []);
  }

  function setCart(cart) {
    storageSet("foodflow_cart", cart);
    updateCartCount();
  }

  function getFood(id) {
    return foods.find(food => food.id === id) || null;
  }

  function cartTotal(cart) {
    return cart.reduce((sum, item) => {
      const food = getFood(item.id);
      return food ? sum + food.price * item.qty : sum;
    }, 0);
  }

  function addToCart(id, qty = 1) {
    const food = getFood(id);
    if (!food) {
      toast("This item is not available");
      return;
    }
    const cart = getCart();
    const item = cart.find(row => row.id === id);
    if (item) item.qty += qty;
    else cart.push({ id, qty });
    setCart(cart);
    toast(`${food.name} added to cart`);
  }

  function updateCart(id, qty) {
    const next = getCart().map(item => item.id === id ? { ...item, qty: Math.max(1, qty) } : item);
    setCart(next);
    renderCart();
  }

  function removeFromCart(id) {
    setCart(getCart().filter(item => item.id !== id));
    toast("Item removed");
    renderCart();
  }

  function updateCartCount() {
    const count = getCart().reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll("[data-cart-count]").forEach(node => { node.textContent = count; });
  }

  function toast(message) {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container position-fixed top-0 end-0 p-3";
      document.body.appendChild(container);
    }
    const node = document.createElement("div");
    node.className = "toast ff-toast border-0 mb-2";
    node.role = "status";
    node.innerHTML = `<div class="toast-body d-flex align-items-center gap-2"><span class="material-symbols-outlined">check_circle</span>${message}</div>`;
    container.appendChild(node);
    const instance = new bootstrap.Toast(node, { delay: 2400 });
    node.addEventListener("hidden.bs.toast", () => node.remove());
    instance.show();
  }

  function shellPath(path) {
    return document.body.dataset.depth === "admin" ? `../${path}` : path;
  }

  function injectShell() {
    const header = document.querySelector("[data-ff-header]");
    if (header) {
      const loggedIn = Boolean(authToken());
      const authActions = loggedIn
        ? `<a class="ff-btn ff-btn-ghost d-none d-md-inline-flex py-2 px-4" href="${shellPath("profile.html")}"><span class="material-symbols-outlined">person</span>Profile</a><button class="ff-btn ff-btn-outline d-none d-md-inline-flex py-2 px-4" type="button" data-logout>Logout</button>`
        : `<a class="ff-btn ff-btn-ghost d-none d-md-inline-flex py-2 px-4" href="${shellPath("login.html")}">Login</a><a class="ff-btn ff-btn-outline d-none d-md-inline-flex py-2 px-4" href="${shellPath("register.html")}">Register</a>`;
      const links = [
        ["home", "Home", "index.html"],
        ["menu", "Menu", "menu.html"],
        ["about", "About", "about.html"],
        ["contact", "Contact", "contact.html"]
      ];
      header.innerHTML = `
        <header class="ff-header">
          <nav class="navbar navbar-expand-lg ff-navbar ff-container p-0">
            <a class="ff-brand me-4" href="${shellPath("index.html")}">FoodFlow</a>
            <button class="navbar-toggler border-0 ff-icon-btn" type="button" data-bs-toggle="collapse" data-bs-target="#ffNav" aria-label="Open menu">
              <span class="material-symbols-outlined">menu</span>
            </button>
            <div class="collapse navbar-collapse" id="ffNav">
              <ul class="navbar-nav gap-lg-3 me-auto mb-3 mb-lg-0">
                ${links.map(([id, label, href]) => `<li class="nav-item"><a class="ff-nav-link ${page === id ? "active" : ""}" href="${shellPath(href)}">${label}</a></li>`).join("")}
              </ul>
              <form class="ff-search me-lg-3 mb-3 mb-lg-0" role="search" data-global-search>
                <span class="material-symbols-outlined">search</span>
                <input aria-label="Search menu" placeholder="Search biryani, dosa, thali..." type="search">
              </form>
              <div class="d-flex align-items-center gap-2">
                <a class="ff-icon-btn position-relative" href="${shellPath("cart.html")}" aria-label="Cart">
                  <span class="material-symbols-outlined">shopping_cart</span>
                  <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" data-cart-count>0</span>
                </a>
                ${authActions}
                <a class="ff-btn ff-btn-primary d-none d-md-inline-flex py-2 px-4" href="${shellPath("menu.html")}">Order Now</a>
              </div>
            </div>
          </nav>
        </header>`;
    }

    const footer = document.querySelector("[data-ff-footer]");
    if (footer) {
      footer.innerHTML = `
        <footer class="ff-footer">
          <div class="ff-container">
            <div class="row g-4">
              <div class="col-md-4">
                <a class="ff-title text-primary d-inline-block mb-3" href="${shellPath("index.html")}">FoodFlow</a>
                <p class="text-secondary-emphasis">Serving India's favourite meals with efficient kitchen queues, warm hospitality, and reliable delivery since 2024.</p>
                <div class="d-flex gap-3 mt-4">
                  ${["public", "chat", "campaign"].map(icon => `<a class="ff-icon-btn bg-primary bg-opacity-10 text-primary" href="#" aria-label="${icon}"><span class="material-symbols-outlined">${icon}</span></a>`).join("")}
                </div>
              </div>
              <div class="col-6 col-md-2"><h3 class="h6 fw-bold mb-3">Quick Links</h3><div class="d-grid gap-3"><a href="${shellPath("menu.html")}">Menu</a><a href="${shellPath("my-orders.html")}">My Orders</a><a href="${shellPath("queue.html")}">Queue</a><a href="${shellPath("about.html")}">About</a></div></div>
              <div class="col-6 col-md-2"><h3 class="h6 fw-bold mb-3">Support</h3><div class="d-grid gap-3"><a href="${shellPath("contact.html")}">Contact</a><a href="${shellPath("login.html")}">Login</a><a href="${shellPath("register.html")}">Register</a><a href="${shellPath("admin/dashboard.html")}">Admin</a></div></div>
              <div class="col-md-4"><h3 class="h6 fw-bold mb-3">Contact Us</h3><ul class="list-unstyled d-grid gap-3 text-secondary-emphasis"><li><span class="material-symbols-outlined text-primary align-middle me-2">mail</span>namaste@foodflow.in</li><li><span class="material-symbols-outlined text-primary align-middle me-2">call</span>+91 98765 43210</li><li><span class="material-symbols-outlined text-primary align-middle me-2">location_on</span>12 Spice Street, Indiranagar, Bengaluru 560038</li></ul></div>
            </div>
            <div class="border-top mt-5 pt-4 text-center text-secondary-emphasis opacity-75">Copyright 2024 FoodFlow Indian Kitchens. All rights reserved.</div>
          </div>
        </footer>`;
    }

    const bottom = document.querySelector("[data-ff-bottom-nav]");
    if (bottom) {
      bottom.innerHTML = `
        <nav class="ff-bottom-nav d-md-none">
          <div class="d-flex justify-content-around align-items-center h-100 py-2 px-2">
            ${[
              ["home", "home", "Home", "index.html"],
              ["menu", "restaurant_menu", "Menu", "menu.html"],
              ["queue", "hourglass_top", "Queue", "queue.html"],
              ["cart", "shopping_bag", "Cart", "cart.html"]
            ].map(([id, icon, label, href]) => `<a class="${page === id ? "active" : ""} position-relative" href="${shellPath(href)}"><span class="material-symbols-outlined">${icon}</span><span>${label}</span>${id === "cart" ? `<span class="position-absolute top-0 end-0 badge rounded-pill bg-danger" data-cart-count>0</span>` : ""}</a>`).join("")}
          </div>
        </nav>`;
    }
  }

  function foodCard(food) {
    return `
      <article class="ff-card ff-card-hover overflow-hidden h-100">
        <div class="position-relative">
          <a href="food-details.html?id=${food.id}"><img class="food-img" src="${food.image}" alt="${food.name}"></a>
          <span class="badge-soft position-absolute top-0 start-0 m-3">${food.tag}</span>
          <button class="ff-icon-btn bg-white position-absolute top-0 end-0 m-3" data-favorite="${food.id}" aria-label="Favorite ${food.name}"><span class="material-symbols-outlined">favorite</span></button>
        </div>
        <div class="p-4">
          <div class="d-flex justify-content-between gap-3 mb-2">
            <h3 class="h5 fw-bold mb-0">${food.name}</h3>
            <span class="d-inline-flex align-items-center text-warning fw-bold"><span class="material-symbols-outlined fs-6" style="font-variation-settings:'FILL' 1">star</span>${food.rating}</span>
          </div>
          <p class="text-secondary-emphasis mb-4">${food.desc}</p>
          <div class="d-flex justify-content-between align-items-center gap-3 flex-wrap">
            <span class="price">${money.format(food.price)}</span>
            <button class="ff-btn ff-btn-primary py-2 px-4" data-add-cart="${food.id}">Add to Cart</button>
          </div>
        </div>
      </article>`;
  }

  function renderMenu() {
    const grid = document.querySelector("[data-menu-grid]");
    if (!grid) return;
    const search = document.querySelector("[data-menu-search]");
    const category = document.querySelector("[data-category-filter]");
    const sort = document.querySelector("[data-sort]");
    const pagination = document.querySelector("[data-pagination]");
    category.innerHTML = categories.map(cat => `<button class="ff-btn ${cat === "All" ? "ff-btn-primary" : "ff-btn-ghost"} py-2 px-3" data-category="${cat}">${cat}</button>`).join("");

    function filtered() {
      const term = (search.value || "").trim().toLowerCase();
      const active = category.querySelector(".ff-btn-primary")?.dataset.category || "All";
      const sorted = foods.filter(food => (active === "All" || food.category === active) && [food.name, food.category, food.desc].join(" ").toLowerCase().includes(term));
      const mode = sort.value;
      if (mode === "price-asc") sorted.sort((a, b) => a.price - b.price);
      if (mode === "price-desc") sorted.sort((a, b) => b.price - a.price);
      if (mode === "rating") sorted.sort((a, b) => b.rating - a.rating);
      return sorted;
    }

    function paint() {
      const rows = filtered();
      const pages = Math.max(1, Math.ceil(rows.length / perPage));
      currentPage = Math.min(currentPage, pages);
      const start = (currentPage - 1) * perPage;
      grid.innerHTML = rows.slice(start, start + perPage).map(foodCard).join("") || `<div class="col-12"><div class="ff-card p-5 text-center">No dishes match your search.</div></div>`;
      pagination.innerHTML = Array.from({ length: pages }, (_, index) => `<button class="ff-btn ${currentPage === index + 1 ? "ff-btn-primary" : "ff-btn-ghost"} py-2 px-3" data-page-num="${index + 1}">${index + 1}</button>`).join("");
    }

    category.addEventListener("click", event => {
      const btn = event.target.closest("[data-category]");
      if (!btn) return;
      category.querySelectorAll("button").forEach(node => node.classList.replace("ff-btn-primary", "ff-btn-ghost"));
      btn.classList.replace("ff-btn-ghost", "ff-btn-primary");
      currentPage = 1;
      paint();
    });
    search.addEventListener("input", () => { currentPage = 1; paint(); });
    sort.addEventListener("change", paint);
    pagination.addEventListener("click", event => {
      const btn = event.target.closest("[data-page-num]");
      if (!btn) return;
      currentPage = Number(btn.dataset.pageNum);
      paint();
    });
    const query = new URLSearchParams(location.search).get("q");
    if (query) search.value = query;
    paint();
  }

  function renderHome() {
    const homeGrid = document.querySelector("[data-home-foods]");
    if (homeGrid) homeGrid.innerHTML = foods.slice(0, 3).map(foodCard).join("") || `<div class="col-12"><div class="ff-card p-5 text-center">No menu items found in MongoDB. Run <strong>npm run seed</strong>.</div></div>`;

    const categoryGrid = document.querySelector("[data-home-categories]");
    if (categoryGrid) {
      categoryGrid.innerHTML = categoryRecords.slice(0, 3).map(category => {
        const count = foods.filter(food => food.category === category.name).length;
        return `<div class="col-md-4"><a class="ff-card category-tile position-relative d-block" href="menu.html?q=${encodeURIComponent(category.name)}"><img src="${category.imageUrl}" alt="${category.name}"><div class="category-content"><h3 class="h4 fw-bold">${category.name}</h3><p>${count} Items</p></div></a></div>`;
      }).join("") || `<div class="col-12"><div class="ff-card p-5 text-center">No categories found in MongoDB.</div></div>`;
    }
  }

  function renderFoodDetails() {
    const root = document.querySelector("[data-food-details]");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("id");
    const food = getFood(id);
    if (!food) {
      root.innerHTML = `<div class="ff-card p-5 text-center"><h1 class="ff-title">Food item not found</h1><a class="ff-btn ff-btn-primary mt-3" href="menu.html">Back to Menu</a></div>`;
      return;
    }
    const gallery = [food, ...foods.filter(item => item.id !== food.id)].slice(0, 3);
    root.innerHTML = `
      <div class="row g-5 align-items-start">
        <div class="col-lg-6">
          <img class="rounded-4 shadow-lg w-100 mb-3" src="${food.image}" alt="${food.name}">
          <div class="row g-3">${gallery.map(item => `<div class="col-4"><img class="rounded-4 food-thumb" src="${item.image}" alt="${item.name}"></div>`).join("")}</div>
        </div>
        <div class="col-lg-6">
          <span class="ff-eyebrow mb-3"><span class="material-symbols-outlined">restaurant</span>${food.category}</span>
          <h1 class="ff-display mb-3">${food.name}</h1>
          <p class="ff-subtitle">${food.desc}</p>
          <div class="d-flex align-items-center gap-3 my-4"><span class="price">${money.format(food.price)}</span><span class="text-warning fw-bold"><span class="material-symbols-outlined align-middle" style="font-variation-settings:'FILL' 1">star</span>${food.rating}</span></div>
          <div class="ff-card p-4 mb-4"><h2 class="h5 fw-bold">Ingredients</h2><div class="d-flex flex-wrap gap-2">${food.ingredients.map(item => `<span class="badge rounded-pill text-bg-light border">${item}</span>`).join("")}</div><hr><h2 class="h5 fw-bold">Nutrition</h2><p class="mb-0 text-secondary-emphasis">${food.nutrition}</p></div>
          <div class="d-flex align-items-center gap-3 flex-wrap mb-4"><div class="qty-control" data-detail-qty><button data-minus aria-label="Decrease"><span class="material-symbols-outlined">remove</span></button><span>1</span><button data-plus aria-label="Increase"><span class="material-symbols-outlined">add</span></button></div><button class="ff-btn ff-btn-primary" data-detail-add="${food.id}">Add to Cart</button></div>
        </div>
      </div>
      <section class="mt-5"><h2 class="ff-title mb-4">Reviews</h2><div class="ff-card p-5 text-center">Reviews will appear here after customer feedback is stored in MongoDB.</div></section>`;
  }

  function renderCart() {
    const root = document.querySelector("[data-cart]");
    if (!root) return;
    const cart = getCart();
    if (!cart.length) {
      root.innerHTML = `<div class="ff-card p-5 text-center"><span class="material-symbols-outlined text-primary display-3 mb-3">shopping_cart</span><h1 class="ff-title">Your cart is waiting for something delicious.</h1><a class="ff-btn ff-btn-primary mt-3" href="menu.html">Browse Menu</a></div>`;
      return;
    }
    const subtotal = cartTotal(cart);
    const delivery = subtotal > 499 ? 0 : 49;
    const tax = subtotal * 0.05;
    const total = subtotal + delivery + tax;
    root.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-8 d-grid gap-3">
          ${cart.map(item => {
            const food = getFood(item.id);
            if (!food) return "";
            return `<article class="ff-card p-3 d-flex gap-3 align-items-center flex-wrap"><img class="rounded-4" src="${food.image}" alt="${food.name}" style="width:120px;height:96px;object-fit:cover"><div class="flex-grow-1"><h2 class="h5 fw-bold">${food.name}</h2><p class="text-secondary-emphasis mb-0">${money.format(food.price)}</p></div><div class="qty-control"><button data-cart-minus="${item.id}" aria-label="Decrease"><span class="material-symbols-outlined">remove</span></button><span>${item.qty}</span><button data-cart-plus="${item.id}" aria-label="Increase"><span class="material-symbols-outlined">add</span></button></div><button class="ff-icon-btn" data-remove="${item.id}" aria-label="Remove"><span class="material-symbols-outlined">delete</span></button></article>`;
          }).join("")}
        </div>
        <aside class="col-lg-4"><div class="ff-card p-4 position-sticky" style="top:100px"><h2 class="h4 fw-bold mb-4">Order Summary</h2>${summaryRows(subtotal, delivery, tax, total)}<a class="ff-btn ff-btn-primary w-100 mt-4" href="checkout.html">Proceed to Checkout</a></div></aside>
      </div>`;
  }

  function summaryRows(subtotal, delivery, tax, total) {
    return `<div class="d-grid gap-3"><div class="d-flex justify-content-between"><span>Subtotal</span><strong>${money.format(subtotal)}</strong></div><div class="d-flex justify-content-between"><span>Delivery</span><strong>${delivery ? money.format(delivery) : "Free"}</strong></div><div class="d-flex justify-content-between"><span>Tax</span><strong>${money.format(tax)}</strong></div><hr><div class="d-flex justify-content-between fs-5"><span>Total</span><strong class="text-primary">${money.format(total)}</strong></div></div>`;
  }

  function renderCheckout() {
    const root = document.querySelector("[data-checkout-summary]");
    if (!root) return;
    const subtotal = cartTotal(getCart());
    const delivery = subtotal > 499 ? 0 : 49;
    const tax = subtotal * 0.05;
    root.innerHTML = summaryRows(subtotal, delivery, tax, subtotal + delivery + tax);
  }

  async function renderOrders() {
    const root = document.querySelector("[data-orders]");
    if (!root) return;
    if (!authToken()) {
      root.innerHTML = `<div class="ff-card p-5 text-center"><h2 class="ff-title">Login to view your orders</h2><a class="ff-btn ff-btn-primary mt-3" href="login.html">Login</a></div>`;
      return;
    }
    let orders = [];
    try {
      orders = await api("/api/orders");
    } catch (error) {
      toast(error.message);
    }
    root.innerHTML = orders.length ? orders.map(order => {
      const id = order.orderNumber || order.id;
      const items = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + item.quantity, 0) : order.items;
      return `<article class="ff-card p-4 d-flex flex-wrap justify-content-between align-items-center gap-3"><div><span class="badge rounded-pill bg-primary mb-2">${order.status}</span><h2 class="h5 fw-bold">${id}</h2><p class="mb-0 text-secondary-emphasis">${items} items | ${money.format(order.total)}</p></div><div class="d-flex gap-2 flex-wrap"><a class="ff-btn ff-btn-ghost py-2 px-4" href="queue.html?order=${id}">View Details</a><button class="ff-btn ff-btn-primary py-2 px-4" data-reorder="${id}">Reorder</button></div></article>`;
    }).join("") : `<div class="ff-card p-5 text-center"><h2 class="ff-title">No orders yet</h2><a class="ff-btn ff-btn-primary mt-3" href="menu.html">Browse Menu</a></div>`;
  }

  async function renderQueue() {
    const root = document.querySelector("[data-queue]");
    if (!root) return;
    const orderNumber = new URLSearchParams(location.search).get("order") || storageGet("foodflow_last_order", {}).id;
    if (!orderNumber) {
      root.innerHTML = `<div class="ff-card p-5 text-center"><h2 class="ff-title">No active order selected</h2><a class="ff-btn ff-btn-primary mt-3" href="my-orders.html">View My Orders</a></div>`;
      return;
    }

    async function refreshQueue() {
      try {
        const order = await api(`/api/orders/${orderNumber}`);
        const queue = order.queue || {};
        const waitSeconds = Number(queue.estimatedSeconds ?? 0);
        const wait = Number(queue.estimatedMinutes ?? order.estimatedMinutes ?? 0);
        const progress = Number(queue.progress ?? order.progress ?? 0);
        const status = queue.status || order.status || "--";

        root.querySelector("[data-position]").textContent = queue.queueNumber || order.queueNumber || "--";
        root.querySelector("[data-wait]").textContent = waitSeconds > 0 ? formatWait(waitSeconds, wait) : "Ready now";
        root.querySelector("[data-progress]").style.width = `${progress}%`;
        root.querySelector("[data-queue-status]").textContent = status;
        root.querySelector("[data-orders-ahead]").textContent = queue.ordersAhead ?? "--";
        root.querySelector("[data-total-items]").textContent = queue.totalItems ?? "--";
        root.querySelector("[data-active-orders]").textContent = queue.activeOrders ?? "--";
        root.querySelector("[data-kitchen-stations]").textContent = queue.kitchenStations ?? "--";
        root.querySelector("[data-queue-updated]").textContent = queue.updatedAt ? new Date(queue.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--";
        updateTimeline(status);
      } catch (error) {
        toast(error.message);
      }
    }

    await refreshQueue();
    window.setInterval(refreshQueue, 10000);
  }

  function formatWait(seconds, fallbackMinutes) {
    if (!seconds && fallbackMinutes) return `${fallbackMinutes} min`;
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    if (minutes <= 0) return `${remainder} sec`;
    return `${minutes} min ${String(remainder).padStart(2, "0")} sec`;
  }

  function updateTimeline(status) {
    const order = ["Preparing", "Cooking", "Ready", "Completed"];
    const currentIndex = Math.max(0, order.indexOf(status));
    document.querySelectorAll("[data-queue-timeline] [data-step]").forEach(item => {
      const index = order.indexOf(item.dataset.step);
      item.classList.toggle("done", index < currentIndex || status === "Completed" || status === "Delivered");
      item.classList.toggle("active", index === currentIndex && status !== "Completed" && status !== "Delivered");
    });
  }

  async function renderAdmin() {
    const root = document.querySelector("[data-admin-content]");
    if (!root) return;
    if (!authToken()) {
      root.innerHTML = `<div class="ff-card p-5 text-center"><h2 class="ff-title">Admin login required</h2><a class="ff-btn ff-btn-primary mt-3" href="login.html">Login</a></div>`;
      return;
    }
    let statCards = [];
    let adminOrders = [];
    let adminSummary = { stats: {} };
    try {
      adminSummary = await api("/api/admin/summary");
      statCards = [
        ["Total Orders", String(adminSummary.stats.totalOrders ?? 0), "receipt_long"],
        ["Revenue", money.format(adminSummary.stats.revenue ?? 0), "payments"],
        ["Pending Orders", String(adminSummary.stats.pendingOrders ?? 0), "pending_actions"],
        ["Completed", String(adminSummary.stats.completedOrders ?? 0), "task_alt"]
      ];
      adminOrders = adminSummary.recentOrders || adminSummary.todayOrders || [];
    } catch (error) {
      root.innerHTML = `<div class="ff-card p-5 text-center"><h2 class="ff-title">Admin access required</h2><p class="text-secondary-emphasis">${error.message}</p><a class="ff-btn ff-btn-primary mt-3" href="login.html">Login</a></div>`;
      return;
    }
    if (adminPage === "dashboard") {
      root.innerHTML = `<div class="row g-4 mb-4">${statCards.map(([label, value, icon]) => `<div class="col-md-6 col-xl-3"><div class="ff-card p-4"><span class="material-symbols-outlined text-primary fs-1">${icon}</span><p class="text-secondary-emphasis mb-1">${label}</p><h2 class="fw-black">${value}</h2></div></div>`).join("")}</div><div class="row g-4"><div class="col-lg-8"><div class="ff-card p-4"><h2 class="h4 fw-bold">Recent Orders</h2>${adminOrders.length ? adminTable(adminOrders) : `<div class="p-4 text-center text-secondary-emphasis">No MongoDB orders yet.</div>`}</div></div><div class="col-lg-4"><div class="ff-card p-4"><h2 class="h4 fw-bold">Today</h2><div class="p-4 text-center"><div class="display-5 fw-black text-primary">${adminSummary.stats.todayOrders ?? 0}</div><p class="mb-0 text-secondary-emphasis">Orders placed today</p></div></div></div></div>`;
    } else if (adminPage === "orders") {
      root.innerHTML = `<div class="ff-card p-4"><div class="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-3"><div><h2 class="h4 fw-bold mb-1">All Recent Orders</h2><p class="text-secondary-emphasis mb-0">Latest ${adminOrders.length} orders from MongoDB</p></div><a class="ff-btn ff-btn-ghost py-2 px-4" href="dashboard.html">Dashboard</a></div>${adminOrders.length ? adminTable(adminOrders) : `<div class="p-4 text-center text-secondary-emphasis">No MongoDB orders yet.</div>`}</div>`;
    } else if (["orders", "foods", "categories", "customers", "reports"].includes(adminPage)) {
      renderAdminSection(root);
    }
  }

  function adminTable(rows) {
    const statuses = ["Preparing", "Cooking", "Ready", "Completed", "Delivered", "Cancelled"];
    return `<div class="table-responsive"><table class="table align-middle"><thead><tr><th>ID</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(row => {
      const id = row.orderNumber || row.id;
      const items = Array.isArray(row.items) ? row.items.reduce((sum, item) => sum + item.quantity, 0) : row.items;
      return `<tr><td>${id}</td><td>${items}</td><td>${money.format(row.total)}</td><td><select class="form-select form-select-sm" data-status data-order-id="${row._id || ""}">${statuses.map(status => `<option value="${status}" ${status === row.status ? "selected" : ""}>${status}</option>`).join("")}</select></td><td><button class="ff-btn ff-btn-ghost py-2 px-3" data-admin-save>Save</button></td></tr>`;
    }).join("")}</tbody></table></div>`;
  }

  function renderAdminSection(root) {
    const title = adminPage.charAt(0).toUpperCase() + adminPage.slice(1);
    root.innerHTML = `<div class="ff-card p-5 text-center"><h2 class="h4 fw-bold mb-2">Manage ${title}</h2><p class="text-secondary-emphasis mb-0">This page is ready for MongoDB CRUD screens. Use the dashboard for live order data now.</p></div>`;
  }

  function wireEvents() {
    document.addEventListener("click", async event => {
      const add = event.target.closest("[data-add-cart]");
      if (add) addToCart(add.dataset.addCart);
      const fav = event.target.closest("[data-favorite]");
      if (fav) { fav.classList.toggle("active"); toast("Favorite updated"); }
      const plus = event.target.closest("[data-cart-plus]");
      if (plus) { const item = getCart().find(row => row.id === plus.dataset.cartPlus); updateCart(item.id, item.qty + 1); }
      const minus = event.target.closest("[data-cart-minus]");
      if (minus) { const item = getCart().find(row => row.id === minus.dataset.cartMinus); updateCart(item.id, item.qty - 1); }
      const remove = event.target.closest("[data-remove]");
      if (remove) removeFromCart(remove.dataset.remove);
      const detailAdd = event.target.closest("[data-detail-add]");
      if (detailAdd) addToCart(detailAdd.dataset.detailAdd, Number(document.querySelector("[data-detail-qty] span").textContent));
      const detailPlus = event.target.closest("[data-plus]");
      if (detailPlus) detailPlus.closest("[data-detail-qty]").querySelector("span").textContent = Number(detailPlus.closest("[data-detail-qty]").querySelector("span").textContent) + 1;
      const detailMinus = event.target.closest("[data-minus]");
      if (detailMinus) {
        const node = detailMinus.closest("[data-detail-qty]").querySelector("span");
        node.textContent = Math.max(1, Number(node.textContent) - 1);
      }
      const reorder = event.target.closest("[data-reorder]");
      if (reorder) toast("Reorder will duplicate this MongoDB order in the next API step");
      const adminSave = event.target.closest("[data-admin-save]");
      if (adminSave) {
        const row = adminSave.closest("tr");
        const statusSelect = row?.querySelector("[data-status]");
        const orderId = statusSelect?.dataset.orderId;
        if (orderId) {
          try {
            adminSave.disabled = true;
            adminSave.textContent = "Saving";
            const order = await api(`/api/admin/orders/${orderId}/status`, {
              method: "PATCH",
              body: JSON.stringify({ status: statusSelect.value })
            });
            statusSelect.value = order.status;
            adminSave.textContent = "Saved";
            toast("Status updated in MongoDB");
            setTimeout(() => {
              adminSave.disabled = false;
              adminSave.textContent = "Save";
            }, 900);
          } catch (error) {
            adminSave.disabled = false;
            adminSave.textContent = "Save";
            toast(error.message);
          }
        } else {
          toast("Status update needs a saved MongoDB order");
        }
      }
      const adminAdd = event.target.closest("[data-admin-add]");
      if (adminAdd) showModal("Create item", "This CRUD action is ready for the Express and MongoDB admin API.");
      const logout = event.target.closest("[data-logout]");
      if (logout) {
        localStorage.removeItem("foodflow_token");
        localStorage.removeItem("foodflow_user");
        toast("Logged out");
        setTimeout(() => location.href = shellPath("login.html"), 400);
      }
    });

    document.querySelectorAll("form[data-validate]").forEach(form => {
      form.addEventListener("submit", async event => {
        event.preventDefault();
        if (!form.checkValidity()) {
          form.classList.add("was-validated");
          toast("Please complete the highlighted fields");
          return;
        }
        if (form.dataset.validate === "checkout") {
          try {
            const order = await api("/api/orders", {
              method: "POST",
              body: JSON.stringify({
                cartItems: getCart(),
                paymentMethod: form.querySelector("[name=pay]:checked")?.parentElement?.textContent?.trim() || "UPI on delivery",
                deliveryAddress: {
                  fullName: form.querySelector("[placeholder='Full name']").value,
                  phone: form.querySelector("[placeholder='Phone']").value,
                  line1: form.querySelector("[placeholder='House, street, area']").value,
                  city: form.querySelector("[placeholder='City']").value,
                  pincode: form.querySelector("[placeholder='PIN code']").value
                }
              })
            });
            storageSet("foodflow_last_order", { id: order.orderNumber, queue: order.queueNumber, estimatedMinutes: order.queue?.estimatedMinutes || order.estimatedMinutes });
            setCart([]);
            location.href = "order-success.html";
          } catch (error) {
            toast(error.message);
          }
        } else if (form.dataset.validate === "login") {
          try {
            const result = await api("/api/auth/login", {
              method: "POST",
              body: JSON.stringify({
                email: form.querySelector("[type=email]").value,
                password: form.querySelector("[type=password]").value
              })
            });
            localStorage.setItem("foodflow_token", result.token);
            storageSet("foodflow_user", result.user);
            toast("Login successful");
            const destination = form.dataset.adminLogin ? "dashboard.html" : result.user?.role === "admin" ? "admin/dashboard.html" : "profile.html";
            setTimeout(() => location.href = destination, 600);
          } catch (error) {
            toast(error.message);
          }
        } else if (form.dataset.validate === "register") {
          const password = form.querySelector("[name=password]").value;
          const confirm = form.querySelector("[name=confirm]").value;
          if (password !== confirm) { toast("Passwords must match"); return; }
          try {
            const result = await api("/api/auth/register", {
              method: "POST",
              body: JSON.stringify({
                fullName: `${form.querySelector("[placeholder='First name']").value} ${form.querySelector("[placeholder='Last name']").value}`.trim(),
                email: form.querySelector("[type=email]").value,
                password
              })
            });
            localStorage.setItem("foodflow_token", result.token);
            storageSet("foodflow_user", result.user);
            toast("Account created");
            setTimeout(() => location.href = "profile.html", 600);
          } catch (error) {
            toast(error.message);
          }
        } else {
          if (form.dataset.validate === "profile") {
            try {
              const address = {
                label: "Home",
                line1: form.querySelector("[name=addressLine]").value,
                city: form.querySelector("[name=city]").value,
                pincode: form.querySelector("[name=pincode]").value
              };
              const password = form.querySelector("[name=newPassword]").value;
              const result = await api("/api/auth/me", {
                method: "PUT",
                body: JSON.stringify({
                  fullName: `${form.querySelector("[name=firstName]").value} ${form.querySelector("[name=lastName]").value}`.trim(),
                  phone: form.querySelector("[name=phone]").value,
                  address,
                  ...(password ? { password } : {})
                })
              });
              storageSet("foodflow_user", result.user);
              form.querySelector("[name=newPassword]").value = "";
              toast("Profile saved to MongoDB");
              return;
            } catch (error) {
              toast(error.message);
              return;
            }
          }
          if (form.dataset.validate === "contact") {
            try {
              await api("/api/contact", {
                method: "POST",
                body: JSON.stringify({
                  name: form.querySelector("[placeholder='Name']").value,
                  email: form.querySelector("[type=email]").value,
                  subject: form.querySelector("[placeholder='Subject']").value,
                  message: form.querySelector("textarea").value
                })
              });
            } catch (error) {
              toast(error.message);
              return;
            }
          }
          toast("Submitted successfully");
          form.reset();
          form.classList.remove("was-validated");
        }
      });
    });

    const globalSearch = document.querySelector("[data-global-search]");
    if (globalSearch) {
      globalSearch.addEventListener("submit", event => {
        event.preventDefault();
        const term = encodeURIComponent(globalSearch.querySelector("input").value.trim());
        location.href = shellPath(`menu.html?q=${term}`);
      });
    }

    const promo = document.querySelector("[data-promo]");
    if (promo) promo.addEventListener("click", () => toast("Promo code applied: FOODFLOW50"));
  }

  function showModal(title, body) {
    let node = document.querySelector("#ffModal");
    if (!node) {
      node = document.createElement("div");
      node.id = "ffModal";
      node.className = "modal fade";
      node.tabIndex = -1;
      node.innerHTML = `<div class="modal-dialog modal-dialog-centered"><div class="modal-content ff-card"><div class="modal-header"><h2 class="modal-title h5"></h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div><div class="modal-body"></div><div class="modal-footer"><button class="ff-btn ff-btn-primary py-2 px-4" data-bs-dismiss="modal">Done</button></div></div></div>`;
      document.body.appendChild(node);
    }
    node.querySelector(".modal-title").textContent = title;
    node.querySelector(".modal-body").textContent = body;
    new bootstrap.Modal(node).show();
  }

  function renderSuccess() {
    const root = document.querySelector("[data-success]");
    if (!root) return;
    const last = storageGet("foodflow_last_order", null);
    if (!last) {
      root.innerHTML = `<div class="ff-card p-5 text-center mx-auto" style="max-width:720px"><h1 class="ff-title">No recent MongoDB order found</h1><a class="ff-btn ff-btn-primary mt-3" href="menu.html">Place an Order</a></div>`;
      return;
    }
    root.querySelector("[data-order-id]").textContent = last.id;
    root.querySelector("[data-queue-id]").textContent = last.queue;
    root.querySelector("[data-estimated-time]").textContent = `${last.estimatedMinutes || "--"} min`;
    root.querySelector("[data-track-order]").href = `queue.html?order=${encodeURIComponent(last.id)}`;
  }

  async function renderProfile() {
    const profileRoot = document.querySelector("[data-profile-root]");
    if (profileRoot) {
      if (!authToken()) {
        profileRoot.innerHTML = `<div class="ff-card p-5 text-center"><h2 class="ff-title">Login to view your profile</h2><a class="ff-btn ff-btn-primary mt-3" href="login.html">Login</a></div>`;
      } else {
        try {
          const { user } = await api("/api/auth/me");
          const form = profileRoot.querySelector("form[data-validate='profile']");
          const [firstName, ...rest] = (user.fullName || "").split(" ");
          const address = user.addresses?.[0] || {};
          form.querySelector("[name=firstName]").value = firstName || "";
          form.querySelector("[name=lastName]").value = rest.join(" ");
          form.querySelector("[name=email]").value = user.email || "";
          form.querySelector("[name=email]").readOnly = true;
          form.querySelector("[name=phone]").value = user.phone || "";
          form.querySelector("[name=addressLine]").value = address.line1 || "";
          form.querySelector("[name=city]").value = address.city || "";
          form.querySelector("[name=pincode]").value = address.pincode || "";

          const stats = profileRoot.querySelector("[data-profile-stats]");
          let orderCount = 0;
          let statsHref = "my-orders.html";
          let statsLabel = "View order history";
          try {
            if (user.role === "admin") {
              const summary = await api("/api/admin/summary");
              orderCount = summary.stats.totalOrders ?? 0;
              statsHref = "admin/dashboard.html";
              statsLabel = "Open admin dashboard";
            } else {
              const orders = await api("/api/orders");
              orderCount = orders.length;
            }
          } catch (error) {
            orderCount = 0;
          }
          stats.innerHTML = `<div class="col-6"><div class="ff-card p-4 text-center"><div class="display-5 fw-black text-primary">${orderCount}</div><p class="mb-0">Orders</p></div></div><div class="col-6"><div class="ff-card p-4 text-center"><div class="display-5 fw-black text-primary">${user.role}</div><p class="mb-0">Role</p></div></div><div class="col-12"><a class="ff-card p-4 d-flex justify-content-between align-items-center" href="${statsHref}"><strong>${statsLabel}</strong><span class="material-symbols-outlined">arrow_forward</span></a></div>`;
        } catch (error) {
          profileRoot.innerHTML = `<div class="ff-card p-5 text-center"><h2 class="ff-title">Session expired</h2><p class="text-secondary-emphasis">${error.message}</p><a class="ff-btn ff-btn-primary mt-3" href="login.html">Login</a></div>`;
        }
      }
    }

    document.querySelectorAll("[data-password-strength]").forEach(strength => {
      const input = document.querySelector(strength.dataset.passwordTarget || "[name=newPassword], [name=password]");
      if (!input) return;
      input.addEventListener("input", () => {
        const score = Math.min(100, input.value.length * 12);
        strength.style.width = `${score}%`;
        strength.className = `progress-bar ${score > 70 ? "bg-success" : "bg-warning"}`;
      });
    });
  }

  async function init() {
    injectShell();
    await loadFoods();
    updateCartCount();
    renderHome();
    renderMenu();
    renderFoodDetails();
    renderCart();
    renderCheckout();
    renderSuccess();
    await renderQueue();
    await renderOrders();
    await renderProfile();
    await renderAdmin();
    wireEvents();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
