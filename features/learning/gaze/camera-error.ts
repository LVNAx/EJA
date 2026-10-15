export function cameraMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Kamera belum diizinkan. Kamu tetap bisa memakai latihan membaca biasa.";
  if (name === "NotFoundError")
    return "Kamera tidak ditemukan pada perangkat ini.";
  if (name === "NotReadableError")
    return "Kamera sedang dipakai aplikasi lain. Tutup aplikasi itu, lalu coba lagi.";
  if (error instanceof Error && error.message === "camera-unavailable")
    return "Kamera belum didukung. Buka melalui localhost atau HTTPS dengan browser yang mendukung kamera.";
  return "Kamera atau model pelacakan belum bisa digunakan. Coba lagi atau pilih membaca tanpa kamera.";
}
