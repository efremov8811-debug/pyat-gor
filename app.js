(() => {
  const S = window.SHOP;
  const { TEAS, SET } = S;
  const tg = window.Telegram && window.Telegram.WebApp;
  // initData заполнен только когда страница открыта внутри Telegram
  const inTg = !!(tg && tg.initData);
  const app = document.getElementById("app");
  const viewer = document.getElementById("story");

  let page = "home";
  let current = null; // товар на экране — для кнопки «Заказать»
  let homeScroll = 0; // чтобы вернуться на главную туда же, где был
  let storyIndex = -1; // открытая история, -1 — закрыта

  const rub = (n) => n.toLocaleString("ru-RU") + " ₽";

  // Силуэты гор, viewBox 0 0 200 100
  const SHAPES = {
    beshtau: "M0 100 L0 84 L22 72 L38 54 L50 62 L66 36 L80 50 L100 20 L118 46 L132 38 L148 58 L162 52 L180 74 L200 82 L200 100 Z",
    mashuk: "M0 100 L0 88 C40 82 60 40 100 36 C140 40 160 82 200 88 L200 100 Z",
    elbrus: "M0 100 L0 86 L40 72 L70 46 L92 22 L104 30 L116 18 L140 46 L170 70 L200 80 L200 100 Z",
    // плато с плоской вершиной и крутыми склонами
    bermamyt: "M0 100 L0 84 L30 74 L52 46 L62 38 L140 36 L150 44 L172 70 L200 80 L200 100 Z",
  };
  const mountain = (shape, cls = "") =>
    `<svg class="mtn ${cls}" viewBox="0 0 200 100" aria-hidden="true"><path d="${SHAPES[shape]}"/></svg>`;

  // Фото с заглушкой: если файла нет, <img> удаляет себя и видна подпись
  // focus — какую часть фото оставить при обрезке, например "30% 50%"
  const photo = (src, label, cls = "", focus = "") =>
    `<div class="ph ${cls}" data-label="${label}"><img src="${src}" alt="${label}" loading="lazy"${
      focus ? ` style="object-position:${focus}"` : ""
    } onerror="this.remove()"></div>`;

  const head = (eyebrow, title) =>
    `<div class="sec-head"><span class="eyebrow">${eyebrow}</span><h2>${title}</h2></div>`;

  // ---------- Главная ----------

  function teaCard(t) {
    return `
      <a class="tea" href="#/tea/${t.id}" style="--accent:${t.color}">
        <div class="tea-info">
          <span class="tea-sub">${t.subtitle}</span>
          <span class="tea-name">${t.name}</span>
          <span class="tea-taste">${t.taste}</span>
          <span class="tea-price">${rub(t.price)} · ${t.weight} г</span>
        </div>
        ${photo(t.photo, t.photoLabel, "on-color", t.focus)}
        ${mountain(t.shape, "tea-mtn")}
      </a>`;
  }

  function setCard() {
    return `
      <a class="tea set" href="#/set">
        <div class="tea-info">
          <span class="tea-sub">${SET.subtitle}</span>
          <span class="tea-name">${SET.name}</span>
          <div class="set-dots">${TEAS.map((t) => `<span style="background:${t.color}"></span>`).join("")}</div>
          <span class="tea-price">${rub(SET.price)} · ${SET.weight} г</span>
        </div>
        ${photo(SET.photo, SET.photoLabel, "on-color")}
      </a>`;
  }

  function collectors() {
    return S.COLLECTORS.map(
      (c) => `
        <article class="person">
          ${photo(c.photo, "сборщик, " + c.place)}
          <div class="person-body">
            <div class="person-name">${c.name}</div>
            <div class="person-place">${c.place}</div>
            <p class="person-quote">«${c.quote}»</p>
          </div>
        </article>`
    ).join("");
  }

  function reviews() {
    if (!S.REVIEWS.length) {
      return `
        <div class="empty">
          <p>Здесь появятся отзывы первых покупателей. Попробуй — и расскажи, как тебе.</p>
          <button class="btn" data-scroll="catalog">Выбрать сбор</button>
        </div>`;
    }
    return `<div class="hscroll">${S.REVIEWS.map(
      (r) => `
        <article class="review">
          <p>«${r.text}»</p>
          <div class="review-meta">${r.name}, ${r.city} · ${r.tea}</div>
        </article>`
    ).join("")}</div>`;
  }

  function homePage() {
    const H = S.HERO;
    const tabs = [
      ["catalog", "Сборы"],
      ["stories", "Истории"],
      ["collectors", "Сборщики"],
      ["reviews", "Отзывы"],
      ["delivery", "Доставка"],
    ];
    return `
      <header class="hero">
        ${photo(H.photo, H.photoLabel, "on-color")}
        ${mountain("beshtau", "hero-mtn")}
        <div class="hero-content">
          <span class="eyebrow">Горный чай КМВ</span>
          <h1>${H.title}</h1>
          <p class="hero-lead">${H.lead}</p>
          <div class="hero-dots">${TEAS.map((t) => `<span style="background:${t.color}"></span>`).join("")}<b>4 сбора · 4 горы</b></div>
        </div>
      </header>

      <nav class="tabs">${tabs.map(([id, t]) => `<button class="tab" data-scroll="${id}">${t}</button>`).join("")}</nav>

      <div class="stories" id="stories">${S.STORIES.map(
        (s, i) => `
          <button class="story-btn" data-story="${i}">
            <span class="story-ring" style="--c:${s.color}">${photo(s.cover, s.coverLabel, "", s.focus)}</span>${s.title}
          </button>`
      ).join("")}</div>

      <section class="five">
        <div class="five-num">5</div>
        <div>
          <h2>Почему «Пять гор»</h2>
          <p>Бештау по-тюркски — «пять гор». Так называется гора над Пятигорском, и так мы назвали наш чай.</p>
        </div>
      </section>
      <p class="note">Настоящий чайный куст на КМВ не растёт. Поэтому честно: это травяные сборы — горный чай, каким его заваривают здесь. На каждой пачке написано, где росли травы.</p>

      <section id="catalog">
        ${head("Каталог", "Выбери свою гору")}
        <div class="grid">${TEAS.map(teaCard).join("")}${setCard()}</div>
      </section>

      <section id="collectors">
        ${head("Сборщики", "Люди, которых мы знаем лично")}
        <div class="hscroll">${collectors()}</div>
      </section>

      <section id="reviews">
        ${head("Отзывы", "Что говорят те, кто попробовал")}
        ${reviews()}
      </section>

      <section id="delivery">
        ${head("Доставка и оплата", "Как чай доедет до тебя")}
        <div class="rows">${S.DELIVERY.map(
          (d, i) => `
            <div class="row">
              <div class="row-num" style="background:${TEAS[i % TEAS.length].color}">${i + 1}</div>
              <div><b>${d.title}</b><span>${d.text}</span></div>
            </div>`
        ).join("")}</div>
      </section>

      <footer>
        <div class="footer-logo">Пять гор</div>
        Кавказские Минеральные Воды
      </footer>`;
  }

  // ---------- Страница сбора и набора ----------

  function backButton() {
    // В Telegram есть своя кнопка «Назад» в шапке
    return inTg ? "" : `<a class="back-fab" href="#/">← Все сборы</a>`;
  }

  function orderButton(p) {
    // Внутри Telegram используется нижняя кнопка самого Telegram (MainButton)
    return inTg ? "" : `<button class="btn" data-order>Заказать · ${rub(p.price)}</button>`;
  }

  function miniCard(p) {
    const isSet = p.id === SET.id;
    return `
      <a class="mini${isSet ? " mini-set" : ""}" href="${isSet ? "#/set" : `#/tea/${p.id}`}" style="--accent:${p.color}">
        <span class="tea-sub">${p.subtitle}</span>
        <span class="mini-name">${p.name}</span>
        <span class="mini-price">${rub(p.price)}</span>
        ${p.shape ? mountain(p.shape, "tea-mtn") : ""}
      </a>`;
  }

  function teaPage(t) {
    const c = S.COLLECTORS.find((x) => x.id === t.collectorId);
    return `
      <div style="--accent:${t.color}">
        <header class="p-hero">
          ${photo(t.photo, t.photoLabel, "on-color", t.focus)}
          ${mountain(t.shape, "hero-mtn")}
          ${backButton()}
          <div class="p-hero-content">
            <span class="tea-sub">${t.subtitle}</span>
            <h1>${t.name}</h1>
          </div>
        </header>

        <div class="price-row"><b>${rub(t.price)}</b><span>${t.weight} г</span></div>
        <p class="p-lead">${t.taste}</p>
        <div class="chips">${t.composition.map((x) => `<span class="chip">${x}</span>`).join("")}</div>

        <dl class="facts">
          <div class="fact"><dt>Для кого</dt><dd>${t.forWhom}</dd></div>
          <div class="fact"><dt>Где собрано</dt><dd>${t.place}</dd></div>
        </dl>

        <section>
          ${head("История горы", t.name)}
          <p class="story-quote">${t.story}</p>
          ${c ? `
            <div class="collector-mini">
              ${photo(c.photo, c.name)}
              <div><small>Собирал</small><b>${c.name}</b>, ${c.place}</div>
            </div>` : ""}
        </section>

        <section>
          ${head("Как заваривать", "Просто и без церемоний")}
          <div class="brew">${S.BREWING.map((b) => `<div><b>${b.value}</b><span>${b.label}</span></div>`).join("")}</div>
          <p class="storage">Хранение: ${S.STORAGE.charAt(0).toLowerCase() + S.STORAGE.slice(1)}</p>
        </section>

        ${orderButton(t)}

        <section>
          ${head("Попробуй ещё", "Другие горы")}
          <div class="mini-grid">${[...TEAS.filter((x) => x.id !== t.id), SET].map(miniCard).join("")}</div>
        </section>
      </div>`;
  }

  function setPage() {
    return `
      <div style="--accent:${SET.color}">
        <header class="p-hero" style="background:var(--rainbow)">
          ${photo(SET.photo, SET.photoLabel, "on-color")}
          ${backButton()}
          <div class="p-hero-content">
            <span class="tea-sub">${SET.subtitle}</span>
            <h1>${SET.name}</h1>
          </div>
        </header>
        <div class="price-row"><b>${rub(SET.price)}</b><span>${SET.weight} г</span></div>
        <p class="p-lead">${SET.text}</p>
        ${orderButton(SET)}
        <section>
          ${head("Что внутри", "Четыре горы в одной коробке")}
          <div class="grid">${TEAS.map(teaCard).join("")}</div>
        </section>
      </div>`;
  }

  // ---------- Видео-истории ----------

  function openStory(i) {
    const s = S.STORIES[i];
    storyIndex = i;
    viewer.style.setProperty("--c", s.color);
    viewer.innerHTML = `
      <div class="sv-media">
        ${photo(s.cover, s.coverLabel, "on-color", s.focus)}
        <video src="${s.video}" autoplay muted loop playsinline onerror="this.remove()"></video>
      </div>
      <div class="sv-bars">${S.STORIES.map((_, j) => `<span class="${j < i ? "done" : j === i ? "on" : ""}"></span>`).join("")}</div>
      <div class="sv-title">${s.coverLabel}</div>
      <button class="sv-prev" data-prev aria-label="Предыдущая история"></button>
      <button class="sv-next" data-next aria-label="Следующая история"></button>
      <button class="sv-close" data-close aria-label="Закрыть">×</button>`;
    viewer.hidden = false;
    document.body.style.overflow = "hidden";
    updateTelegramButtons();
  }

  function closeStory() {
    if (storyIndex < 0) return;
    storyIndex = -1;
    viewer.hidden = true;
    viewer.innerHTML = "";
    document.body.style.overflow = "";
    updateTelegramButtons();
  }

  // ---------- Заказ ----------

  function notify(msg) {
    if (inTg && tg.isVersionAtLeast("6.2")) tg.showAlert(msg);
    else alert(msg);
  }

  function order(p) {
    if (!p) return;
    if (!S.BOT_USERNAME) {
      notify("Заказы скоро откроются — бот ещё в разработке.");
      return;
    }
    // Ссылка вида t.me/bot?start=order_elbrus — бот увидит, какой товар выбран
    const link = `https://t.me/${S.BOT_USERNAME}?start=order_${p.id}`;
    if (inTg) {
      tg.openTelegramLink(link);
      // На телефоне витрина остаётся открытой поверх чата, и ответ бота не виден —
      // закрываем её сами, чтобы человек сразу увидел корзину
      setTimeout(() => tg.close(), 300);
    } else {
      window.open(link, "_blank");
    }
  }

  // ---------- Telegram ----------

  function applyTheme() {
    document.documentElement.dataset.theme = tg.colorScheme;
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    try {
      tg.setHeaderColor(bg);
      tg.setBackgroundColor(bg);
    } catch (e) {
      // старые версии Telegram не умеют произвольные цвета — не страшно
    }
  }

  function updateTelegramButtons() {
    if (!inTg) return;
    if (tg.isVersionAtLeast("6.1")) {
      page !== "home" || storyIndex >= 0 ? tg.BackButton.show() : tg.BackButton.hide();
    }
    if (current && storyIndex < 0) {
      tg.MainButton.setParams({
        text: `Заказать · ${rub(current.price)}`,
        color: current.color,
        text_color: "#ffffff",
        is_visible: true,
      });
    } else {
      tg.MainButton.hide();
    }
  }

  // ---------- Навигация ----------

  function render() {
    const [, p, id] = (location.hash.slice(1) || "/").split("/");
    const tea = p === "tea" && TEAS.find((t) => t.id === id);
    if (page === "home") homeScroll = window.scrollY;
    closeStory();

    if (tea) {
      page = "tea";
      current = tea;
      app.innerHTML = teaPage(tea);
    } else if (p === "set") {
      page = "set";
      current = SET;
      app.innerHTML = setPage();
    } else {
      page = "home";
      current = null;
      app.innerHTML = homePage();
    }

    window.scrollTo(0, page === "home" ? homeScroll : 0);
    updateTelegramButtons();
  }

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-order],[data-scroll],[data-story],[data-close],[data-next],[data-prev]");
    if (!el) return;
    const d = el.dataset;
    if ("order" in d) order(current);
    else if ("scroll" in d) document.getElementById(d.scroll).scrollIntoView({ behavior: "smooth", block: "start" });
    else if ("story" in d) openStory(+d.story);
    else if ("close" in d) closeStory();
    else if ("next" in d) storyIndex + 1 < S.STORIES.length ? openStory(storyIndex + 1) : closeStory();
    else if ("prev" in d) openStory(Math.max(0, storyIndex - 1));
  });
  window.addEventListener("hashchange", render);

  if (inTg) {
    tg.ready();
    tg.expand();
    applyTheme();
    tg.onEvent("themeChanged", applyTheme);
    tg.MainButton.onClick(() => order(current));
    if (tg.isVersionAtLeast("6.1")) {
      tg.BackButton.onClick(() => (storyIndex >= 0 ? closeStory() : (location.hash = "#/")));
    }
  }

  render();
})();
