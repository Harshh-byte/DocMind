export async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          resolve("");
          return;
        }

        if (typeof window !== "undefined" && !(window as any).pdfjsLib) {
          await new Promise<void>((res, rej) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            script.onload = () => res();
            script.onerror = () => rej(new Error("Failed to load PDF.js script"));
            document.head.appendChild(script);
          });
        }

        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ");
          fullText += `[Page ${i}]\n${pageText}\n\n`;
        }

        resolve(fullText);
      } catch (err) {
        console.error("PDF parsing error:", err);
        resolve("");
      }
    };
    reader.onerror = () => resolve("");
    reader.readAsArrayBuffer(file);
  });
}

export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    return extractTextFromPDF(file);
  }
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string || "");
    };
    reader.onerror = () => resolve("");
    reader.readAsText(file);
  });
}
