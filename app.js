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
  const viewerOpen = () => storyIndex >= 0;

  // Истории без обложки (файла ещё нет) не показываем
  const missingStories = new Set();
  window.storyMissing = (i, img) => {
    missingStories.add(i);
    // обычные проверки if вместо «опциональной цепочки» — её не понимают браузеры Telegram на части телефонов
    const btn = img.closest(".story-btn");
    if (btn) btn.remove();
    const strip = document.getElementById("stories");
    if (strip && !document.querySelector(".story-btn")) strip.remove();
  };
  const neighbourStory = (from, step) => {
    for (let j = from + step; j >= 0 && j < S.STORIES.length; j += step) if (!missingStories.has(j)) return j;
    return -1;
  };

  // ?dev в адресе — показать подписи «Фото: …» на местах, где фото ещё нет
  document.documentElement.classList.toggle("dev", new URLSearchParams(location.search).has("dev"));

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
  // Адрес фото с версией публикации: GitHub и Telegram держат картинки в кэше,
  // и без неё заменённый снимок с тем же именем файла показывался бы по-старому
  const asset = (src) =>
    window.ASSET_V && window.ASSET_V !== "dev" ? `${src}?v=${window.ASSET_V}` : src;

  // focus — какую часть фото оставить при обрезке, например "30% 50%".
  // shape — силуэт горы, который виден, пока своего фото нет.
  const photo = (src, label, cls = "", focus = "", shape = "") =>
    `<div class="ph ${cls}" data-label="${label}">${shape ? mountain(shape, "ph-mtn") : ""}<img src="${asset(src)}" alt="${label}" loading="lazy"${
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
        ${photo(t.photo, t.photoLabel, "on-color", t.focus, t.shape)}
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
        ${photo(SET.photo, SET.photoLabel, "on-color", "", "beshtau")}
      </a>`;
  }

  function collectors() {
    const ready = S.COLLECTORS.filter((c) => c.ready);
    if (!ready.length) {
      return `
        <div class="empty">
          <p>Скоро познакомим тебя с людьми, у которых мы берём травы. Снимаем их во время поездки на КМВ.</p>
        </div>`;
    }
    return `<div class="hscroll">${ready.map(
      (c) => `
        <article class="person">
          ${photo(c.photo, "сборщик, " + c.place)}
          <div class="person-body">
            <div class="person-name">${c.name}</div>
            <div class="person-place">${c.place}</div>
            <p class="person-quote">«${c.quote}»</p>
          </div>
        </article>`
    ).join("")}</div>`;
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

      <span class="eyebrow stories-note">${S.STORIES_NOTE}</span>
      <div class="stories" id="stories">${S.STORIES.map((s, i) =>
        missingStories.has(i) ? "" : `
          <button class="story-btn" data-story="${i}">
            <span class="story-ring" style="--c:${s.color}"><span class="ph"><img src="${asset(s.cover)}" alt="" onerror="storyMissing(${i}, this)"${
              s.focus ? ` style="object-position:${s.focus}"` : ""
            }></span></span>${s.title}
          </button>`
      ).join("")}</div>

      <section class="five">
        <svg class="five-num" viewBox="0 0 100 130" aria-hidden="true">
          <defs>
            <linearGradient id="five-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#16a36b"/><stop offset=".38" stop-color="#6d4dff"/>
              <stop offset=".68" stop-color="#e5412f"/><stop offset="1" stop-color="#ff7a00"/>
            </linearGradient>
          </defs>
          <text x="50" y="112" text-anchor="middle" fill="url(#five-grad)"
                font-family="'Playfair Display', Georgia, serif" font-weight="800" font-size="140">5</text>
        </svg>
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
        </dl>

        <section>
          ${head("История горы", t.name)}
          <p class="story-quote">${t.story}</p>
          ${c && c.ready ? `
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
      <div class="sv-media sv-contain">
        ${photo(s.cover, s.coverLabel, "on-color", s.focus)}
        <video src="${s.video}" autoplay muted loop playsinline onerror="this.remove()"></video>
      </div>
      <div class="sv-bars">${S.STORIES.map((_, j) =>
        missingStories.has(j) ? "" : `<span class="${j < i ? "done" : j === i ? "on" : ""}"></span>`
      ).join("")}</div>
      <div class="sv-title">${s.coverLabel}${s.desc ? `<small>${s.desc}</small>` : ""}</div>
      <button class="sv-prev" data-prev aria-label="Предыдущая история"></button>
      <button class="sv-next" data-next aria-label="Следующая история"></button>
      <button class="sv-close" data-close aria-label="Закрыть">×</button>`;
    viewer.hidden = false;
    document.body.style.overflow = "hidden";
    updateTelegramButtons();
  }

  function closeStory() {
    if (!viewerOpen()) return;
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
      page !== "home" || viewerOpen() ? tg.BackButton.show() : tg.BackButton.hide();
    }
    if (current && !viewerOpen()) {
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
    else if ("next" in d) {
      const j = neighbourStory(storyIndex, 1);
      j < 0 ? closeStory() : openStory(j);
    } else if ("prev" in d) {
      const j = neighbourStory(storyIndex, -1);
      if (j >= 0) openStory(j);
    }
  });
  window.addEventListener("hashchange", render);

  // Ленту историй на компьютере листаем колёсиком мыши: вбок её иначе не прокрутить.
  // У краёв ленты колёсико снова прокручивает страницу.
  document.addEventListener(
    "wheel",
    (e) => {
      const strip = e.target.closest && e.target.closest(".stories");
      if (!strip || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const max = strip.scrollWidth - strip.clientWidth;
      const atStart = strip.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = strip.scrollLeft >= max - 1 && e.deltaY > 0;
      if (max <= 0 || atStart || atEnd) return;
      strip.scrollLeft += e.deltaY;
      e.preventDefault();
    },
    { passive: false }
  );

  if (inTg) {
    tg.ready();
    tg.expand();
    applyTheme();
    tg.onEvent("themeChanged", applyTheme);
    tg.MainButton.onClick(() => order(current));
    if (tg.isVersionAtLeast("6.1")) {
      tg.BackButton.onClick(() => (viewerOpen() ? closeStory() : (location.hash = "#/")));
    }
  }

  render();
})();
