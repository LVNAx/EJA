import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCameraTracker } from "./camera-tracker";

beforeEach(() => {
  vi.stubGlobal("window", { isSecureContext: true });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

describe("siklus kamera", () => {
  it("membersihkan stream yang baru datang sesudah pengguna membatalkan izin", async () => {
    let resolve!: (stream: unknown) => void;
    const stop = vi.fn();
    const getUserMedia = vi.fn(
      (_constraints: MediaStreamConstraints) =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    const controller = new AbortController();
    const play = vi.fn();
    const video = { srcObject: null, play } as unknown as HTMLVideoElement;
    const pending = createCameraTracker(
      video,
      vi.fn(),
      vi.fn(),
      controller.signal,
    );
    controller.abort();
    resolve({ getTracks: () => [{ stop }] });
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(stop).toHaveBeenCalled();
    expect(play).not.toHaveBeenCalled();
    expect(video.srcObject).toBeNull();
    expect(getUserMedia.mock.calls[0][0]).toMatchObject({ audio: false });
  });
  it("tidak meminta kamera jika sudah dibatalkan atau bukan konteks aman", async () => {
    const getUserMedia = vi.fn();
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    const controller = new AbortController();
    controller.abort();
    await expect(
      createCameraTracker(
        {} as HTMLVideoElement,
        vi.fn(),
        vi.fn(),
        controller.signal,
      ),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(getUserMedia).not.toHaveBeenCalled();
    vi.stubGlobal("window", { isSecureContext: false });
    await expect(
      createCameraTracker(
        {} as HTMLVideoElement,
        vi.fn(),
        vi.fn(),
        new AbortController().signal,
      ),
    ).rejects.toThrow("camera-unavailable");
  });
  it("meneruskan penolakan izin tanpa memuat model", async () => {
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: vi
          .fn()
          .mockRejectedValue(new DOMException("Denied", "NotAllowedError")),
      },
    });
    await expect(
      createCameraTracker(
        {} as HTMLVideoElement,
        vi.fn(),
        vi.fn(),
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ name: "NotAllowedError" });
  });
});
