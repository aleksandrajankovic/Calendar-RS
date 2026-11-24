// Server (nginx) odbija upload veći od ~1 MB (413). Velike slike zato smanjujemo u browseru pre slanja:
// ista ili manja rezolucija (do maxWidth), WebP — za fotografije obično 3–5x manje. Server ih ionako
// pretvara u WebP, pa se kvalitet praktično ne menja. SVG i male slike idu bez izmene.
const LIMIT = 950 * 1024;

export async function shrinkForUpload(file, { maxWidth = 1600 } = {}) {
  if (!file || file.size <= LIMIT || !/^image\/(png|jpeg|webp)$/.test(file.type)) return file;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // browser ne ume da je dekodira — pusti server da odluči
  }
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  for (const quality of [0.88, 0.8, 0.7, 0.6]) {
    const blob = await new Promise((res) => canvas.toBlob(res, "image/webp", quality));
    if (blob && blob.type === "image/webp" && blob.size <= LIMIT) {
      const name = file.name.replace(/\.[a-z0-9]+$/i, "") + ".webp";
      return new File([blob], name, { type: "image/webp" });
    }
  }
  return file; // nije uspelo dovoljno da se smanji — server će javiti grešku
}
