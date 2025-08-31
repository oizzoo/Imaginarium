document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("pdfModal");
  const closeBtn = modal.querySelector(".close");
  const viewerContainer = document.getElementById("pdfViewerContainer");

  document.querySelectorAll(".open-pdf").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const pdfPath = this.getAttribute("data-pdf");
      modal.style.display = "block";
      document.body.style.overflow = "hidden";

      // Wyczyść poprzednią zawartość
      viewerContainer.innerHTML = "";

      // Ładowanie PDF
      const loadingTask = pdfjsLib.getDocument(pdfPath);
      loadingTask.promise.then(function (pdf) {
        const totalPages = pdf.numPages;

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          pdf.getPage(pageNum).then(function (page) {
            const viewport = page.getViewport({ scale: 1.2 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            viewerContainer.appendChild(canvas);

            page.render({
              canvasContext: context,
              viewport: viewport
            });
          });
        }
      });
    });
  });

  closeBtn.addEventListener("click", function () {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
  });

  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  });
});
