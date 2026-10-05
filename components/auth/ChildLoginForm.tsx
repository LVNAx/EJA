"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState } from "react-dom";
import { Illustration } from "@/components/screening/Illustration";
import { isAvatar } from "@/lib/avatars";
import type { ChildProfile } from "@/lib/dashboard/types";
import { enterChild, resetChildPin } from "@/lib/auth/child-actions";
import { Field, Message, SubmitButton } from "./AuthForms";

export function ChildLoginForm({ profiles, selectedId, next, demo }: { profiles: ChildProfile[]; selectedId?: string; next?: string; demo: boolean }) {
  const [selected, setSelected] = useState(profiles.find((child) => child.id === selectedId)?.id ?? profiles[0]?.id ?? "");
  const [state, action] = useFormState(enterChild, {});
  if (!profiles.length) return <div className="flex flex-col gap-4"><p>Belum ada profil anak. Minta orang tua membuat profil dulu.</p><Link className="btn-primary" href="/dashboard/child/new">Buat profil anak</Link></div>;
  return <form action={action} className="flex flex-col gap-5">
    <fieldset><legend className="mb-3 text-lg font-bold">Pilih avatarmu</legend><div className="grid grid-cols-2 gap-3">{profiles.map((child) => <label key={child.id} className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-4 ${child.id === selected ? "border-brand-500 bg-brand-50" : "border-neutral-200 bg-white"}`}><input className="h-5 w-5 accent-purple-600" type="radio" name="childId" value={child.id} checked={selected === child.id} onChange={() => setSelected(child.id)} required /><Illustration name={isAvatar(child.avatar) ? child.avatar : "kucing"} size={64} /><span className="font-bold">{child.name}</span></label>)}</div></fieldset>
    <input type="hidden" name="next" value={next ?? ""} />
    {demo ? <Link className="btn-primary" href={`/child/${selected}`}>Coba dashboard anak</Link> : <><Field label="PIN 4 angka" name="pin" type="password" inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} autoComplete="off" /><Message state={state} /><SubmitButton pending="Memeriksa PIN…">Ayo masuk</SubmitButton></>}
    <Link href="/unlock" className="text-center text-sm font-semibold text-brand-700 underline">Untuk orang tua</Link>
  </form>;
}

export function ResetChildPinForm({ childId }: { childId: string }) {
  const [state, action] = useFormState(resetChildPin, {});
  return <form action={action} className="card flex flex-col gap-4 p-6"><h2 className="text-xl font-bold">Ganti PIN anak</h2><input type="hidden" name="childId" value={childId} /><Field label="PIN baru" name="pin" type="password" inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} autoComplete="new-password" /><Field label="Ulangi PIN baru" name="pinConfirm" type="password" inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} autoComplete="new-password" /><Message state={state} /><SubmitButton>Simpan PIN baru</SubmitButton></form>;
}
