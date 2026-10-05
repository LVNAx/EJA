// Satu tempat untuk alamat lintas modul, supaya mudah disesuaikan saat modul lain (auth, belajar) selesai.
export const DEMO_CHILD_ID = "demo";

export const ROUTES = {
  login: "/login",
  childLogin: "/masuk-anak",
  dashboard: "/dashboard",
  /** Pembuatan profil anak dikerjakan modul Auth/Profil. */
  addChild: "/dashboard/child/new",
  childDashboard: (id: string) => `/dashboard/child/${encodeURIComponent(id)}`,
  childScreeningReport: (id: string) => `/dashboard/child/${encodeURIComponent(id)}/screening`,
  screening: (id: string) => `/screening/${encodeURIComponent(id)}`,
  /** Beranda anak (Modul Belajar). */
  childHome: (id: string) => `/child/${encodeURIComponent(id)}`,
  learningHome: (id: string) => `/child/${encodeURIComponent(id)}/belajar`,
} as const;
