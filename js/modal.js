document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("pdfModal");
  const viewer = document.getElementById("pdfViewerContainer");
  const closeBtn = modal?.querySelector(".close");
  if (!modal || !viewer || !closeBtn) return;

  const en = document.documentElement.lang === "en";
  const loading = en ? "Loading PDF…" : "Ładowanie PDF…";
  const error = en ? "Preview unavailable. Use Open PDF." : "Podgląd niedostępny. Użyj Otwórz PDF.";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", en ? "PDF preview" : "Podgląd PDF");
  closeBtn.setAttribute("role", "button");
  closeBtn.setAttribute("aria-label", en ? "Close preview" : "Zamknij podgląd");
  closeBtn.tabIndex = 0;
  viewer.tabIndex = 0;
  viewer.setAttribute("aria-label", en ? "PDF pages" : "Strony PDF");
  const directLink = document.createElement("a");
  directLink.className = "cta-link";
  directLink.textContent = en ? "Open PDF" : "Otwórz PDF";
  directLink.target = "_blank";
  directLink.rel = "noopener";
  viewer.parentNode.insertBefore(directLink, viewer);
  let session = null;

  function close() {
    if (!session) return;
    const previous = session;
    session = null;
    previous.observer?.disconnect();
    previous.renderTask?.cancel();
    previous.loadingTask?.destroy().catch(() => {});
    viewer.querySelectorAll("canvas").forEach(canvas => { canvas.width = canvas.height = 0; });
    viewer.replaceChildren();
    modal.style.display = "none";
    document.body.style.overflow = previous.overflow;
    previous.background.forEach(([element, inert]) => { element.inert = inert; });
    previous.opener.focus();
  }

  function fail(current) {
    if (session !== current) return;
    current.failed = true;
    current.observer?.disconnect();
    current.status.textContent = error;
  }

  function nearEnd(current) {
    return current.status.getBoundingClientRect().top < viewer.getBoundingClientRect().bottom + 200;
  }

  async function renderNext(current) {
    if (session !== current || current.busy || current.failed || current.next > current.pdf.numPages) return;
    current.busy = true;
    current.status.textContent = loading;
    try {
      const page = await current.pdf.getPage(current.next);
      if (session !== current) return;
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      current.renderTask = page.render({ canvasContext: canvas.getContext("2d"), viewport });
      await current.renderTask.promise;
      if (session !== current) return;
      viewer.insertBefore(canvas, current.status);
      page.cleanup();
      current.next++;
      const finished = current.next > current.pdf.numPages;
      current.status.textContent = finished ? "" : (en ? "Scroll for more pages." : "Przewiń, aby zobaczyć kolejne strony.");
      if (finished) current.observer.disconnect();
    } catch {
      fail(current);
    } finally {
      current.busy = false;
      current.renderTask = null;
      if (session === current && !current.failed && nearEnd(current)) renderNext(current);
    }
  }

  document.querySelectorAll(".open-pdf").forEach(opener => {
    opener.addEventListener("click", async event => {
      event.preventDefault();
      close();
      const status = document.createElement("p");
      status.setAttribute("role", "status");
      status.textContent = loading;
      const current = {
        opener, status, next: 1, overflow: document.body.style.overflow,
        background: Array.from(document.body.children)
          .filter(element => !element.contains(modal)).map(element => [element, element.inert]),
      };
      session = current;
      directLink.href = opener.getAttribute("data-pdf");
      viewer.replaceChildren(status);
      viewer.scrollTop = 0;
      modal.style.display = "block";
      document.body.style.overflow = "hidden";
      current.background.forEach(([element]) => { element.inert = true; });
      closeBtn.focus();
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js";
        current.loadingTask = pdfjsLib.getDocument({ url: directLink.href, isEvalSupported: false });
        current.pdf = await current.loadingTask.promise;
        if (session !== current) return;
        current.observer = new IntersectionObserver(entries => {
          if (entries.some(entry => entry.isIntersecting)) renderNext(current);
        }, { root: viewer, rootMargin: "200px" });
        current.observer.observe(status);
        renderNext(current);
      } catch {
        fail(current);
      }
    });
  });

  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", event => { if (event.target === modal) close(); });
  modal.addEventListener("keydown", event => {
    if (event.key === "Escape" || (event.target === closeBtn && ["Enter", " "].includes(event.key))) {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      const controls = [closeBtn, directLink, viewer];
      const index = controls.indexOf(document.activeElement);
      event.preventDefault();
      controls[(index + (event.shiftKey ? 2 : 1)) % controls.length].focus();
    }
  });
});

