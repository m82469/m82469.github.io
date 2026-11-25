import base64
import json
import pathlib
import time
import urllib.request

ROOT = pathlib.Path(__file__).parent / "assets" / "images"
API = "https://stablehorde.net/api/v2"
HEADERS = {
    "Content-Type": "application/json",
    "apikey": "0000000000",
    "Client-Agent": "wedding-invitation:1.0:local",
}

SHARED = (
    "editorial fine art wedding photography, the same elegant young Slavic couple, "
    "woman with chestnut brown hair in a soft low bun, natural makeup, minimalist ivory silk wedding dress, "
    "man with short dark brown hair, classic black suit and white shirt, no bow tie, "
    "authentic tender emotion, soft diffused golden daylight, ivory sage and warm beige palette, "
    "subtle analog film grain, luxury European wedding magazine, realistic skin texture, photorealistic, "
)
NEGATIVE = "text, watermark, logo, extra fingers, extra limbs, deformed hands, plastic skin, cartoon, illustration"

IMAGES = [
    (
        "couple-hero.jpg",
        SHARED + "full length portrait, couple standing close in a blooming wildflower meadow, bride holding a small bouquet of white cosmos and olive branches, groom gently holding her waist, vertical composition, airy negative space above them",
        "8272027",
    ),
    (
        "couple-walk.jpg",
        SHARED + "candid three quarter portrait, couple walking hand in hand through a sunlit olive garden, looking at each other and smiling softly, bride's dress moving in a light breeze, vertical composition",
        "8272027",
    ),
    (
        "couple-details.jpg",
        SHARED + "close-up portrait from shoulders up, groom tenderly touching bride's forehead with his, eyes closed, delicate white flowers blurred in the foreground, intimate quiet moment, horizontal composition",
        "8272027",
    ),
]


def request(path, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(API + path, data=data, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=60) as response:
        return json.load(response)


for filename, prompt, seed in IMAGES:
    if (ROOT / filename).exists():
        print(f"{filename}: already exists", flush=True)
        continue
    payload = {
        "prompt": prompt + " ### " + NEGATIVE,
        "params": {
            "sampler_name": "k_euler_a",
            "cfg_scale": 6.5,
            "height": 1024 if filename != "couple-details.jpg" else 768,
            "width": 768 if filename != "couple-details.jpg" else 1024,
            "steps": 28,
            "n": 1,
            "seed": seed,
        },
        "models": ["AlbedoBase XL 3.1"],
        "nsfw": False,
        "r2": True,
        "replacement_filter": True,
    }
    job = request("/generate/async", payload)
    job_id = job["id"]
    print(f"{filename}: queued {job_id}", flush=True)
    for _ in range(120):
        time.sleep(5)
        status = request(f"/generate/check/{job_id}")
        print(f"{filename}: wait {status.get('wait_time')}s, queue {status.get('queue_position')}", flush=True)
        if status.get("done"):
            break
        if status.get("faulted"):
            raise RuntimeError(f"Generation failed: {status}")
    else:
        raise TimeoutError(filename)
    result = request(f"/generate/status/{job_id}")
    image = result["generations"][0]["img"]
    target = ROOT / filename
    if image.startswith("http"):
        with urllib.request.urlopen(image, timeout=90) as response:
            target.write_bytes(response.read())
    else:
        target.write_bytes(base64.b64decode(image))
    print(f"{filename}: saved {target.stat().st_size} bytes", flush=True)
