#!/usr/bin/env python3
"""
Xử lý audio bằng GStreamer + `audioop` của Python — KHÔNG cần ffmpeg, không cần numpy.

Máy dựng game này không có ffmpeg, mà bộ nhạc hiện có cũng đã nén bằng GStreamer
(`public/audio/README.md`), nên dùng tiếp đúng một bộ công cụ: giải mã bằng
`decodebin` ra WAV 16-bit, cắt / chỉnh / nối vòng bằng Python, nén lại bằng
`lamemp3enc`. Không khâu nào cần thư viện ngoài.
"""
import array, math, os, subprocess, wave
import audioop

SR = 44100

#: Trần đỉnh của bản ĐÃ NÉN, P5-03 §2.2. Kiểm bằng cách giải mã lại chính file mp3.
TRUE_PEAK_CEILING = -1.5


# ───────────────────────────────────────────────────────────── vào / ra bằng gst

def decode(src: str, dst_wav: str, rate: int = SR):
    """File gì cũng được -> WAV 16-bit `rate` Hz, giữ nguyên số kênh (tối đa 2)."""
    caps = f"audio/x-raw,format=S16LE,rate={rate},channels=2"
    cmd = ["gst-launch-1.0", "-q", "filesrc", f"location={src}", "!", "decodebin", "!",
           "audioconvert", "!", "audioresample", "quality=10", "!", caps, "!",
           "wavenc", "!", "filesink", f"location={dst_wav}"]
    subprocess.run(cmd, check=True, capture_output=True)


def encode_mp3(src_wav: str, dst: str, bitrate: int = 96, mono: bool = False):
    cmd = ["gst-launch-1.0", "-q", "filesrc", f"location={src_wav}", "!", "wavparse", "!",
           "audioconvert", "!",
           "lamemp3enc", "target=bitrate", f"bitrate={bitrate}", "cbr=false",
           f"mono={'true' if mono else 'false'}", "encoding-engine-quality=2", "!",
           "filesink", f"location={dst}"]
    subprocess.run(cmd, check=True, capture_output=True)


# ───────────────────────────────────────────────────────────────── khối PCM đơn

class Pcm:
    """PCM 16-bit interleaved. `ch` là 1 hoặc 2. Mọi thao tác trả về Pcm mới."""

    def __init__(self, data: bytes, ch: int = 2, rate: int = SR):
        self.data, self.ch, self.rate = data, ch, rate

    # ── vào / ra ──────────────────────────────────────────────────────────────
    @classmethod
    def read(cls, path: str) -> "Pcm":
        with wave.open(path, "rb") as w:
            assert w.getsampwidth() == 2, "chỉ nhận WAV 16-bit"
            return cls(w.readframes(w.getnframes()), w.getnchannels(), w.getframerate())

    def write(self, path: str):
        with wave.open(path, "wb") as w:
            w.setnchannels(self.ch); w.setsampwidth(2); w.setframerate(self.rate)
            w.writeframes(self.data)

    # ── đo ────────────────────────────────────────────────────────────────────
    @property
    def frames(self) -> int:
        return len(self.data) // (2 * self.ch)

    @property
    def seconds(self) -> float:
        return self.frames / self.rate

    def rms_db(self) -> float:
        r = audioop.rms(self.data, 2)
        return -120.0 if r <= 0 else 20 * math.log10(r / 32768)

    def peak_db(self) -> float:
        p = audioop.max(self.data, 2)
        return -120.0 if p <= 0 else 20 * math.log10(p / 32768)

    # ── cắt ghép ──────────────────────────────────────────────────────────────
    def slice(self, start_s: float, dur_s: float | None) -> "Pcm":
        bpf = 2 * self.ch
        a = max(0, int(start_s * self.rate)) * bpf
        b = len(self.data) if dur_s is None else min(len(self.data), a + int(dur_s * self.rate) * bpf)
        return Pcm(self.data[a:b], self.ch, self.rate)

    def mono(self) -> "Pcm":
        if self.ch == 1:
            return self
        return Pcm(audioop.tomono(self.data, 2, 0.5, 0.5), 1, self.rate)

    def gain_db(self, db: float) -> "Pcm":
        if abs(db) < 0.01:
            return self
        return Pcm(audioop.mul(self.data, 2, 10 ** (db / 20)), self.ch, self.rate)

    # ── gọt ───────────────────────────────────────────────────────────────────
    def trim_silence(self, floor_db: float = -45.0, pad_ms: int = 8) -> "Pcm":
        """
        Cắt im lặng đầu / cuối. Đây là khâu QUAN TRỌNG NHẤT của foley một phát:
        thư viện nào cũng để dư 100–400 ms im ở đầu, mà một tiếng dao rạch bánh
        nổ CHẬM 300 ms so với cú bấm thì não người chơi không nối nó vào hành động
        nữa — nó thành một tiếng động lạ, không phải phản hồi.
        """
        bpf, win = 2 * self.ch, max(1, self.rate // 400)       # cửa sổ 2,5 ms
        floor = 32768 * 10 ** (floor_db / 20)
        n = self.frames
        lo, hi = 0, n
        for i in range(0, n - win, win):
            if audioop.max(self.data[i * bpf:(i + win) * bpf], 2) > floor:
                lo = i; break
        for i in range(n - win, 0, -win):
            if audioop.max(self.data[i * bpf:(i + win) * bpf], 2) > floor:
                hi = i + win; break
        pad = int(self.rate * pad_ms / 1000)
        lo, hi = max(0, lo - pad), min(n, hi + pad)
        return Pcm(self.data[lo * bpf:hi * bpf], self.ch, self.rate) if hi > lo else self

    def fade(self, in_ms: float = 0, out_ms: float = 0) -> "Pcm":
        if in_ms <= 0 and out_ms <= 0:
            return self
        a = array.array("h"); a.frombytes(self.data)
        n, ch = self.frames, self.ch
        ni = min(n, int(self.rate * in_ms / 1000))
        no = min(n - ni, int(self.rate * out_ms / 1000))
        for i in range(ni):
            g = i / ni
            for c in range(ch):
                a[i * ch + c] = int(a[i * ch + c] * g)
        for j in range(no):
            g = j / no
            k = n - 1 - j
            for c in range(ch):
                a[k * ch + c] = int(a[k * ch + c] * g)
        return Pcm(a.tobytes(), ch, self.rate)

    def loopify(self, xfade_s: float, tail: "Pcm") -> "Pcm":
        """
        Biến một đoạn thành VÒNG LẶP LIỀN MẠCH: trộn `xfade_s` giây lấy từ NGAY SAU
        đoạn (`tail`) vào `xfade_s` giây đầu, theo đường cong equal-power.

        Không làm bước này thì mỗi vòng ambience có một cú "cộp" ở điểm nối, và cái
        cộp đó lặp đúng chu kỳ — tai người bắt nhịp tuần hoàn nhanh hơn bắt nội dung,
        nên nghe ra ngay là băng ghi âm chạy vòng.
        """
        nx = int(xfade_s * self.rate)
        if nx <= 0 or tail.frames < nx or self.frames < nx * 2:
            return self
        ch = self.ch
        head = array.array("h"); head.frombytes(self.data)
        t = array.array("h"); t.frombytes(tail.data[: nx * 2 * ch])
        for i in range(nx):
            x = i / nx
            gh, gt = math.sin(x * math.pi / 2), math.cos(x * math.pi / 2)
            for c in range(ch):
                k = i * ch + c
                head[k] = max(-32768, min(32767, int(head[k] * gh + t[k] * gt)))
        return Pcm(head.tobytes(), ch, self.rate)

    def loudest_window(self, dur_s: float, step_s: float = 0.01) -> float:
        """
        Giây bắt đầu của cửa sổ `dur_s` KÊU TO NHẤT trong file.

        Dùng cho mấy mẩu cắt từ GIỮA một tiếng người: chọn mốc bằng tay thì phải mở
        từng file ra nghe, và chỉ cần một file có 120 ms im ở đầu là cửa sổ rơi trúng
        chỗ im — rồi bước chuẩn hoá kéo đúng chỗ im đó lên mức VO, biến một tiếng
        người thành một tiếng xì. Đã dính đúng một lần như vậy (freesound #88448,
        cửa sổ ở 0,12 s ra −63 dB), và nó chỉ lộ ra khi đo, không lộ ra khi đọc code.
        """
        n, step = self.frames, max(1, int(step_s * self.rate))
        w = int(dur_s * self.rate)
        if w >= n:
            return 0.0
        bpf = 2 * self.ch
        best, best_rms = 0, -1
        for i in range(0, n - w, step):
            r = audioop.rms(self.data[i * bpf:(i + w) * bpf], 2)
            if r > best_rms:
                best_rms, best = r, i
        return best / self.rate

    # ── chuẩn hoá ─────────────────────────────────────────────────────────────
    def soft_limit(self, ceiling_db: float = -3.0, knee_db: float = 4.0) -> "Pcm":
        """
        Bẻ mềm mấy cú vọt đỉnh, thay vì HẠ CẢ FILE xuống cho vừa chúng.

        Đây là chỗ đã làm hỏng tiếng lò than một lần: bản thu lửa có mấy cú nổ lách
        tách nhọn hơn phần nền cả chục dB, nên "hạ gain cho tới khi đỉnh dưới trần"
        kéo luôn phần nền xuống −36 dB — tức là thấp hơn 10 dB so với mức §2.2 giao
        cho ambience, và nghe như không có tiếng lò. Cú nổ là thứ nên bị bẻ; phần
        nền thì không liên quan gì tới nó.

        Đường cong: dưới `ceiling − knee` giữ nguyên tuyệt đối (không đụng vào phần
        lớn tín hiệu), trong vùng knee thì nén dần theo `tanh`. Không phải limiter
        có look-ahead và release — chỗ này không cần, vì nó chạy MỘT LẦN lúc dựng
        asset chứ không chạy trên bản phối trực tiếp.
        """
        ceil = 32767 * 10 ** (ceiling_db / 20)
        knee = 32767 * 10 ** ((ceiling_db - knee_db) / 20)
        if audioop.max(self.data, 2) <= ceil:
            return self
        span = ceil - knee
        a = array.array("h"); a.frombytes(self.data)
        for i, v in enumerate(a):
            m = v if v >= 0 else -v
            if m <= knee:
                continue
            over = (m - knee) / span
            m2 = knee + span * math.tanh(over)
            a[i] = int(m2) if v >= 0 else -int(m2)
        return Pcm(a.tobytes(), self.ch, self.rate)


    def normalize(self, rms_db: float | None, peak_ceiling_db: float = -3.0) -> "Pcm":
        """
        Kéo về mức RMS mong muốn rồi HẠ tiếp nếu đỉnh vượt trần.

        Chuẩn theo RMS chứ không theo đỉnh, vì P5-03 §2.2 ra mức theo LUFS — tức là
        theo độ to NGHE THẤY. Chuẩn theo đỉnh thì một tiếng cạch sắc lẻm và một
        tiếng nước chảy đều đều cùng đỉnh −3 dB, mà nghe thì cái sau to gấp mấy lần.

        TRẦN ĐỈNH −3,0 dBFS chứ không phải −1,5 như §2.2 ghi, và đó là cố ý: §2.2 nói
        về −1,5 dB**TP** (true peak) của bản ĐÃ NÉN, còn con số ở đây đo trên PCM
        TRƯỚC khi nén. MP3 vọt đỉnh lên quá mức PCM — đo lại bản nén ở trần −1,5 thì
        có cả chục file chạm 0,0 dB, tức là đã clip. 1,5 dB dự phòng vừa đủ để bản
        nén về đúng dưới −1,5 dBTP.
        """
        out = self
        if rms_db is not None:
            cur = out.rms_db()
            if cur > -119:
                out = out.gain_db(rms_db - cur)
        # Bẻ mềm trước, HẠ GAIN sau — và cú hạ gain chỉ còn là lưới an toàn cho
        # trường hợp cả file to đều chứ không phải vài cú vọt lẻ.
        out = out.soft_limit(peak_ceiling_db)
        over = out.peak_db() - peak_ceiling_db
        if over > 0.05:
            out = out.gain_db(-over)
        return out


def process(src: str, dst: str, tmpdir: str, *, start: float | str = 0.0, dur=None, mono=False,
            trim=False, fade_in=0.0, fade_out=0.0, loop_xfade=0.0,
            rms=None, peak=-3.0, gain=0.0, bitrate=96, max_dur=None) -> dict:
    """Một file nguồn -> một file mp3 trong game. Trả về vài con số để ghi nhật ký."""
    os.makedirs(tmpdir, exist_ok=True)
    raw = os.path.join(tmpdir, "raw.wav")
    decode(src, raw)
    full = Pcm.read(raw)

    # `start="auto"` -> tự tìm cửa sổ kêu to nhất (xem `loudest_window`).
    if start == "auto":
        start = full.mono().loudest_window(dur or 0.15)
    seg = full.slice(start, dur)
    if loop_xfade > 0:
        tail = full.slice(start + (dur or seg.seconds), loop_xfade)
        seg = seg.loopify(loop_xfade, tail)
    if trim:
        seg = seg.trim_silence()
    if max_dur and seg.seconds > max_dur:
        seg = seg.slice(0, max_dur)
        fade_out = max(fade_out, 25)
    if mono:
        seg = seg.mono()
    seg = seg.fade(fade_in, fade_out)
    if gain:
        seg = seg.gain_db(gain)
    seg = seg.normalize(rms, peak)

    out_wav = os.path.join(tmpdir, "out.wav")
    os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)

    # ĐO LẠI SAU KHI NÉN, không tin con số trên PCM.
    #
    # MP3 vọt đỉnh lên quá mức PCM — bộ lọc tổng hợp lúc giải mã dựng lại tín hiệu
    # bằng mấy băng con, và tổng của chúng vượt mẫu gốc. Mức vọt phụ thuộc nội dung,
    # không đoán được: có file 0,5 dB, có file 3 dB. `P5-03 §2.2` ra trần −1,5 dB**TP**
    # cho bản PHÁT RA, nên chỗ duy nhất đo được là chính bản đã nén.
    #
    # Tối đa ba vòng: nén → giải mã → quá trần thì hạ đúng phần vượt rồi nén lại.
    # Chậm hơn, nhưng đây là tool chạy một lần lúc dựng asset, không phải lúc build.
    probe = os.path.join(tmpdir, "probe.wav")
    trims, peak_after = 0, 0.0
    for _ in range(3):
        seg.write(out_wav)
        encode_mp3(out_wav, dst, bitrate, mono)
        decode(dst, probe)
        peak_after = Pcm.read(probe).peak_db()
        if peak_after <= TRUE_PEAK_CEILING:
            break
        seg = seg.gain_db(TRUE_PEAK_CEILING - peak_after - 0.2)   # 0,2 dB dự phòng
        trims += 1

    return {"seconds": round(seg.seconds, 3), "rms_db": round(seg.rms_db(), 1),
            "peak_db": round(peak_after, 1), "bytes": os.path.getsize(dst), "trims": trims}
