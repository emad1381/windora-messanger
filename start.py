"""One-click launcher (double-click start.bat).

Starts everything: server + web UI (https), the admin datasheet, and opens the web UI in your browser.
Friends on your Wi-Fi/LAN just open the "Friends" address printed below in Chrome.
Missing Python libraries (Pillow, cryptography - see requirements.txt) are installed automatically.

Options:  --local        only this PC (don't open to the network)
          --http         plain http instead of https (voice recording/calls then only work on this PC)
          --no-datasheet / --no-browser / --no-install
"""
import os
import socket
import subprocess
import sys
import time
import webbrowser
from pathlib import Path

here = Path(__file__).resolve().parent
os.environ["WINDROIDA_LAUNCHER"] = "1"
sys.path.insert(0, str(here))
from server import lan_ip  # noqa: E402

PORT, WEB_PORT = 8765, 8087
flags = set(a for a in sys.argv[1:] if a.startswith("--"))


def spawn(script, *args):
    return subprocess.Popen([sys.executable, str(here / script), *args], cwd=str(here))


def port_open(port):
    try:
        socket.create_connection(("127.0.0.1", port), timeout=0.3).close()
        return True
    except OSError:
        return False


REQUIREMENTS = [("PIL", "Pillow", "profile photos"), ("cryptography", "cryptography", "https certificate")]


def ensure_libs():
    """Try to import each library; if missing pip-install it (several fallbacks). Never fatal."""
    import importlib
    missing = []
    for mod, pkg, why in REQUIREMENTS:
        try:
            importlib.import_module(mod)
        except ImportError:
            missing.append((mod, pkg, why))
    if not missing:
        return
    print("  Installing needed libraries: " + ", ".join(p for _, p, _ in missing) + " ...", flush=True)
    for mod, pkg, why in missing:
        done = False
        wheels = here / "wheels"        # offline cache made by download_wheels.bat: works without any internet
        srcs = ([["--no-index", "--find-links", str(wheels)]] if wheels.is_dir() else []) + [[]]
        for src, extra in [(a, b) for a in srcs for b in ([], ["--user"], ["--break-system-packages"], ["--user", "--break-system-packages"])]:
            r = subprocess.run([sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "-q", pkg, *src, *extra],
                               capture_output=True, text=True, timeout=180)
            if r.returncode == 0:
                done = True
                break
        try:
            importlib.invalidate_caches()
            importlib.import_module(mod)
        except ImportError:
            done = False
        print(f"    {'OK  ' if done else 'FAIL'} {pkg}" + ("" if done else f"  (no {why}; run: pip install {pkg})"), flush=True)
    print()


def save_wheels_in_background():
    """With internet: quietly copy the libraries into ./wheels (exactly for THIS Python), so the whole folder can be moved to
    another PC/server and start.bat installs them from there without any internet. Skipped if wheels/ already has files."""
    try:
        wheels = here / "wheels"
        if wheels.is_dir() and any(wheels.glob("*.whl")):
            return
        wheels.mkdir(exist_ok=True)
        kw = {"creationflags": 0x08000000} if os.name == "nt" else {}      # no black window on Windows
        subprocess.Popen([sys.executable, "-m", "pip", "download", "--disable-pip-version-check", "-q", "-r",
                          str(here / "requirements.txt"), "-d", str(wheels)],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, stdin=subprocess.DEVNULL, **kw)
    except Exception:
        pass


def real_scheme(wanted):
    """The server falls back to http if it could not make a certificate; ask it which one it really speaks."""
    if wanted == "http":
        return "http"
    import ssl
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        with socket.create_connection(("127.0.0.1", WEB_PORT), timeout=2) as raw:
            ctx.wrap_socket(raw).close()
        return "https"
    except OSError:
        return "http"


def have_tk():
    try:
        import tkinter  # noqa: F401
        return True
    except ImportError:
        return False


def main():
    if "--no-install" not in flags:
        ensure_libs()
        save_wheels_in_background()
    if port_open(WEB_PORT) or port_open(PORT):
        print("\n  Windroida seems to be running already (port %d/%d is busy)." % (PORT, WEB_PORT))
        print("  Close the other Windroida window first, then try again.\n")
        return 1
    server_args = ["--web", "--web-port", str(WEB_PORT), "--port", str(PORT)]
    if "--local" not in flags:
        server_args += ["--host", "0.0.0.0"]
    scheme = "http" if "--http" in flags else "https"
    if scheme == "http":
        server_args.append("--http")
    procs = [spawn("server.py", *server_args)]
    time.sleep(0.3)
    for _ in range(60):                                   # wait until the server answers
        if procs[0].poll() is not None:
            print("\n  The server could not start (see the message above).\n")
            return 1
        if port_open(WEB_PORT):
            break
        time.sleep(0.2)

    scheme = real_scheme(scheme)
    print("\n" + "=" * 58)
    print("  Windroida is running")
    print(f"    Web UI (this PC):  {scheme}://127.0.0.1:{WEB_PORT}")
    if "--local" not in flags:
        print(f"    Friends (Wi-Fi):   {scheme}://{lan_ip()}:{WEB_PORT}")
    if scheme == "https":
        print("  First visit: the browser warns about the self-signed certificate -> Advanced -> Continue.")
        print("  (https is what lets browsers use the microphone for voice messages and calls.)")
    elif "--http" not in flags:
        print("  https is OFF (certificate could not be created: pip install cryptography). Voice only works on this PC.")
    try:                                              # fingerprint of the server certificate: the Android app asks you to confirm it once
        import hashlib, ssl as _ssl
        _pem = (here / "data" / "server.crt")
        if _pem.exists():
            _fp = hashlib.sha256(_ssl.PEM_cert_to_DER_cert(_pem.read_text())).hexdigest().upper()
            print("  Android app certificate fingerprint (SHA-256):")
            print("    " + ":".join(_fp[i:i + 2] for i in range(0, len(_fp), 2)))
    except Exception:
        pass
    print("  Close this window to stop everything.")
    print("=" * 58 + "\n", flush=True)

    if have_tk():
        if "--no-datasheet" not in flags:
            procs.append(spawn("datasheet.py"))
    else:
        print("  (tkinter is not installed, so the desktop windows are skipped; the web UI works.)\n")
    if "--no-browser" not in flags:
        webbrowser.open(f"{scheme}://127.0.0.1:{WEB_PORT}")

    try:
        crashes = []                                       # supervisor: if the server process dies, start it again (max 8 times in 10 minutes)
        while True:
            while procs[0].poll() is None:
                time.sleep(0.5)
            code = procs[0].returncode
            t = time.time()
            crashes = [x for x in crashes if x > t - 600] + [t]
            if code in (0, None) or len(crashes) > 8:
                break
            print(f"\n  The server stopped unexpectedly (code {code}); restarting in 3 s ... (details: data/windroida.log)\n", flush=True)
            time.sleep(3)
            procs[0] = spawn("server.py", *server_args)
    finally:
        for p in procs:
            if p.poll() is None:
                p.terminate()
    return 0


if __name__ == "__main__":
    sys.exit(main())
