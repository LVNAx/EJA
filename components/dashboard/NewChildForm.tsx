"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { createChild } from "@/app/dashboard/child/new/actions";
import { Field, Message, SubmitButton } from "@/components/auth/AuthForms";
import { Illustration } from "@/components/screening/Illustration";
import { AVATARS } from "@/lib/avatars";

export function NewChildForm() {
  const [state, action] = useFormState(createChild, {});
  const [avatar, setAvatar] = useState<string>(AVATARS[0]);

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Nama anak" name="name" maxLength={60} autoComplete="off" />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">Kelas</span>
        <select name="grade" required defaultValue="" className="rounded-2xl border-2 border-neutral-200 bg-white px-4 py-3 text-base outline-none focus:border-brand-500">
          <option value="" disabled>Pilih kelas</option>
          {[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>Kelas {g}</option>)}
        </select>
      </label>
      <Field label="Sekolah (boleh dikosongkan)" name="school" required={false} maxLength={120} autoComplete="off" />

      <fieldset>
        <legend className="mb-2 text-sm font-bold">Avatar</legend>
        <input type="hidden" name="avatar" value={avatar} />
        <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Avatar">
          {AVATARS.map((a) => (
            <button key={a} type="button" role="radio" aria-checked={avatar === a} aria-label={a} onClick={() => setAvatar(a)} className={`flex items-center justify-center rounded-2xl border-2 bg-white p-2 transition-colors ${avatar === a ? "border-brand-500 bg-brand-50" : "border-neutral-200 hover:border-brand-300"}`}>
              <Illustration name={a} size={48} />
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Field label="PIN anak (4 angka)" name="pin" type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="off" />
        <Field label="Ulangi PIN" name="pinConfirm" type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="off" />
      </div>
      <p className="-mt-2 text-xs text-neutral-500">PIN dipakai anak untuk masuk. PIN disimpan sebagai hash dan tidak dapat dilihat siapa pun, termasuk Anda. Tetap simpan di tempat yang aman.</p>

      <Message state={state} />
      <SubmitButton>Simpan profil</SubmitButton>
    </form>
  );
}
