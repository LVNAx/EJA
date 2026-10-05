import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), user: { id: "11111111-1111-1111-1111-111111111111" } as {id:string}|null, set: vi.fn(), remove: vi.fn(), unlock: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => ({set:mocks.set,delete:mocks.remove}) }));
vi.mock("next/navigation", () => ({ redirect: (href:string) => { throw new Error(`REDIRECT:${href}`); } }));
vi.mock("@/lib/supabase/server", () => ({ isSupabaseConfigured: () => true, createClient: () => ({auth:{getUser:async()=>({data:{user:mocks.user}})},rpc:mocks.rpc}) }));
vi.mock("./guard", () => ({requireParentUnlock:mocks.unlock}));
import { enterChild, resetChildPin } from "./child-actions";
const A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const form = (extra:Record<string,string>={}) => {const f = new FormData(); for (const [key,value] of Object.entries({childId:A,pin:"1234",...extra})) f.set(key,value); return f;};
beforeEach(()=>{vi.clearAllMocks();mocks.user={id:"11111111-1111-1111-1111-111111111111"};});
describe("actions PIN anak",()=>{
  it("PIN gagal tidak menerbitkan sesi",async()=>{
    mocks.rpc.mockResolvedValue({data:{ok:false,status:"invalid"},error:null});
    expect((await enterChild({},form())).error).toContain("belum cocok");
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("PIN sukses menerbitkan cookie HttpOnly dan mencabut unlock parent",async()=>{
    mocks.rpc.mockResolvedValue({data:{ok:true,status:"ok"},error:null});
    await expect(enterChild({},form({next:"/dashboard"}))).rejects.toThrow(`REDIRECT:/child/${A}`);
    expect(mocks.set).toHaveBeenCalledWith("eja_child_session",expect.any(String),expect.objectContaining({httpOnly:true,sameSite:"lax"}));
    expect(mocks.remove).toHaveBeenCalledWith("eja_parent_unlock");
  });
  it("RPC gagal ditolak tanpa sesi",async()=>{
    mocks.rpc.mockResolvedValue({data:null,error:{message:"offline"}});
    expect((await enterChild({},form())).error).toContain("belum dapat");
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("reset PIN meminta unlock parent sebelum mengakses RPC",async()=>{
    mocks.unlock.mockRejectedValueOnce(new Error("LOCKED"));
    await expect(resetChildPin({},form({pinConfirm:"1234"}))).rejects.toThrow("LOCKED");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("PIN harus empat angka",async()=>{
    expect((await enterChild({},form({pin:"12ab"}))).error).toBeTruthy();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
