export const IMPORT_ACCEPT =
  ".png,.jpg,.jpeg,.webp,.dxf,.dwg,.skp,image/png,image/jpeg,image/webp";
export const MODEL_LIMIT = 25 * 1024 * 1024;
export function sourceFormat(name: string) {
  const ext = name.toLowerCase().split(".").pop() || "";
  return ["dxf", "dwg", "skp"].includes(ext)
    ? (ext as "dxf" | "dwg" | "skp")
    : null;
}
export function importError(code: string, lang: "mn" | "en") {
  const mn = lang === "mn";
  if (code === "BINARY_DXF")
    return mn
      ? "Binary DXF дэмжихгүй. CAD программаас ASCII DXF болгон хадгална уу."
      : "Export this binary DXF as ASCII DXF in your CAD application.";
  if (/EMPTY/.test(code))
    return mn
      ? "Харагдах геометр олдсонгүй. Model space болон харагдаж буй давхаргуудаа шалгана уу."
      : "No visible geometry found. Check model space and visible layers.";
  if (code === "TIMEOUT")
    return mn
      ? "Унших хугацаа хэтэрлээ. Файлаа багасгах эсвэл PNG болгон экспортлоно уу."
      : "Reading timed out. Simplify the model or export a PNG.";
  return mn
    ? "Энэ файлыг бүрэн уншиж чадсангүй. Хувилбар эсвэл геометр дэмжигдээгүй байж болно. DXF эсвэл PNG болгон экспортлоод дахин оролдоно уу."
    : "This file could not be read completely. Its version or geometry may be unsupported. Export DXF or PNG and try again.";
}
