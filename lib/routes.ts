// Satu tempat untuk alamat lintas modul, supaya mudah disesuaikan saat modul lain (auth, belajar) selesai.
export const DEMO_CHILD_ID = "demo";

export const ROUTES = {
  login: "/login",
  dashboard: "/dashboard",
  /** Pembuatan profil anak dikerjakan modul Auth/Profil. */
  addChild: "/dashboard/child/new",
  childDashboard: (id: string) => `/dashboard/child/${id}`,
  childScreeningReport: (id: string) => `/dashboard/child/${id}/screening`,
  screening: (id: string) => `/screening/${id}`,
  /** Beranda anak (Modul Belajar). */
  childHome: (id: string) => `/child/${id}`,
} as const;
