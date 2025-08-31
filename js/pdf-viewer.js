// document.addEventListener('DOMContentLoaded', () => {
//   const pdfjsLib = window['pdfjs-dist/build/pdf'];
//   pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

//   const pdfContainer = document.getElementById('pdf-container');

//   if (!pdfContainer) {
//     console.error('Brak kontenera #pdf-container');
//     return;
//   }

//   const url =
//     (window.PDF_URL) // 1. globalna zmienna
//     || pdfContainer.dataset.url // 2. atrybut data-url

//   renderPDF(url);

//   function renderPDF(url) {
//     pdfContainer.innerHTML = '';

//     pdfjsLib.getDocument(url).promise.then(pdfDoc => {
//       for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
//         pdfDoc.getPage(pageNum).then(page => {
//           const scale = 1.5;
//           const viewport = page.getViewport({ scale });

//           const canvas = document.createElement('canvas');
//           const context = canvas.getContext('2d');
//           canvas.height = viewport.height;
//           canvas.width = viewport.width;
//           canvas.style.display = 'block';
//           canvas.style.marginBottom = '10px';

//           pdfContainer.appendChild(canvas);

//           const renderContext = { canvasContext: context, viewport };
//           page.render(renderContext);
//         });
//       }
//     }).catch(error => {
//       console.error('Błąd ładowania PDF:', error);
//     });
//   }
// });
