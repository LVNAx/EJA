import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ exchange: vi.fn(), otp: vi.fn() }));
vi.mock("@/lib/supabase/server",()=>({isSupabaseConfigured:()=>true,createClient:()=>({auth:{exchangeCodeForSession:mocks.exchange,verifyOtp:mocks.otp}})}));
import { GET } from "@/app/auth/callback/route";
const req=(query:string)=>new NextRequest(`http://localhost:3000/auth/callback${query}`);
beforeEach(()=>{vi.clearAllMocks();mocks.exchange.mockResolvedValue({error:null});mocks.otp.mockResolvedValue({error:null});});
describe("callback email",()=>{
  it("kode PKCE mengarah ke unlock bukan langsung memberikan akses parent",async()=>{
    const r=await GET(req("?code=abc&next=https://evil.test"));
    expect(mocks.exchange).toHaveBeenCalledWith("abc");
    expect(r.headers.get("location")).toBe("http://localhost:3000/unlock?next=%2Fdashboard");
  });
  it("mendukung token hash konfirmasi email",async()=>{
    const r=await GET(req("?token_hash=abc&type=email"));
    expect(mocks.otp).toHaveBeenCalledWith({token_hash:"abc",type:"email"});
    expect(r.headers.get("location")).toContain("/unlock");
  });
  it("callback tidak memverifikasi tipe OTP selain email/signup",async()=>{
    const r=await GET(req("?token_hash=abc&type=recovery"));
    expect(mocks.otp).not.toHaveBeenCalled();
    expect(r.headers.get("location")).toContain("error=confirmation");
  });
  it("kode gagal diarahkan ke pesan error",async()=>{
    mocks.exchange.mockResolvedValue({error:{message:"expired"}});
    expect((await GET(req("?code=expired"))).headers.get("location")).toContain("error=confirmation");
  });
});
