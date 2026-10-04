import type { IllustrationName } from "@/components/screening/Illustration";

/** Pilihan avatar anak: ilustrasi yang sudah ada, disimpan sebagai nama di kolom children.avatar. */
export const AVATARS: IllustrationName[] = ["kucing", "ikan", "balon", "bunga", "roket", "apel", "singa", "kupu", "kura", "bulan"];

export const isAvatar = (v: unknown): v is IllustrationName => typeof v === "string" && (AVATARS as string[]).includes(v);
