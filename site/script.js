// Anjo IA — efeitos do site (sem dependências)
(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Vídeo do anjo: toca uma vez e para no anjo brilhando
  const video = document.querySelector(".hero-video");
  if (video && !reduced) {
    const tall = window.matchMedia("(max-width: 880px) and (orientation: portrait)").matches;
    const name = tall ? "anjo-hero-vertical" : "anjo-hero";
    video.poster = `img/${name}.webp`;
    for (const [ext, type] of [["webm", "video/webm"], ["mp4", "video/mp4"]]) {
      const s = document.createElement("source");
      s.src = `video/${name}.${ext}`;
      s.type = type;
      video.appendChild(s);
    }
    video.load();
    video.play().catch(() => {});
  }

  // Ano no rodapé
  const ano = document.getElementById("ano");
  if (ano) ano.textContent = String(new Date().getFullYear());

  // Topo ganha sombra ao rolar
  const top = document.querySelector(".top");
  const onScroll = () => top && top.classList.toggle("scrolled", window.scrollY > 12);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Elementos surgem suavemente ao entrar na tela
  const items = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.14, rootMargin: "0px 0px -40px 0px" },
    );
    items.forEach((el) => io.observe(el));
  }

  // Pontinhos de luz subindo na abertura
  const sparks = document.querySelector(".sparks");
  if (sparks && !reduced) {
    for (let i = 0; i < 22; i++) {
      const s = document.createElement("i");
      s.style.setProperty("--x", `${Math.random() * 100}%`);
      s.style.setProperty("--s", `${6 + Math.random() * 10}px`);
      s.style.setProperty("--t", `${10 + Math.random() * 12}s`);
      s.style.setProperty("--delay", `${-Math.random() * 20}s`);
      sparks.appendChild(s);
    }
  }

  // Ouvir a voz do Anjo (um áudio por vez)
  let current = null;
  document.querySelectorAll(".listen").forEach((btn) => {
    const label = btn.querySelector(".listen-label");
    const original = label ? label.textContent : "";
    btn.addEventListener("click", () => {
      if (current && current.btn === btn) {
        current.audio.pause();
        return;
      }
      if (current) current.audio.pause();
      const audio = new Audio(btn.dataset.audio);
      current = { audio, btn };
      const reset = () => { btn.classList.remove("playing"); if (label) label.textContent = original; if (current && current.btn === btn) current = null; };
      audio.addEventListener("pause", reset);
      audio.addEventListener("ended", reset);
      audio.play().then(() => { btn.classList.add("playing"); if (label) label.textContent = "Pausar"; }).catch(reset);
    });
  });
})();
