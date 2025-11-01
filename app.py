from flask import Flask, render_template, request, redirect, url_for, flash
import requests, os, random
from dotenv import load_dotenv

app = Flask(__name__)
app.secret_key = "super_secret_key"

load_dotenv()
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
print("🔑 Loaded API KEY:", OPENWEATHER_API_KEY)

# 🎵 Weather-based Tamil Song Playlist
SONG_MAP = {
    "rain": [
        "YFYiTS46x-8",  # Hosanna
        "Nz1iHi0fhzI",  # Mazhai Vara Pogudhae
        "Gep0IzKTcFI",  # Enna Solla Pogirai
        "JzTNs0gY_ZU"   # Venmegam Pennaga
    ],
    "clear": [
        "ryD8BqVexJI",  # Adiye (OK Kanmani)
        "HRD2-_bU4K0",  # Mental Manadhil
        "PiL5UTTTrxk",  # Thalli Pogathey
        "uI_ug1H6u0k"   # Mersalaayitten
    ],
    "cloud": [
        "xzxr6fxdI_E",  # Kadhal Cricket
        "2P_0Q8CIjw8",  # Rain Romance
        "OfNQ8Zpq6eQ",  # Kadhal Cricket (backup)
        "pYBIpM5mBm4"   # Naan Pizhaippeno
    ],
    "mist": [
        "FzLpP8VBC6E",  # Nenjukkul Peidhidum
        "p8-n77H6E2U",  # Perfect (Soft)
        "5T0qZV5rsYQ",  # Vinnaithaandi Varuvaayaa Theme
        "v-hL3sks2qI"   # Love Story - Soft mood
    ],
    "snow": [
        "rp3_FhRnIRw",  # Munbe Vaa
        "ew1fKCWb_M4",  # Let It Go
        "UdZzW6QzN-s",  # Yenno Yenno
        "l_At-vg94yE"   # Memories
    ],
    "thunder": [
        "x6Q7c9RyMzk",  # Rowdy Baby
        "KUN5Uf9mObQ",  # Radioactive
        "DV7nV9W7y-0",  # Believer
        "vKWv_DuhOXg"   # Epic music vibe
    ]
}

def make_embed(vid):
    return f"https://www.youtube.com/embed/{vid}?rel=0&autoplay=0"

def make_watch(vid):
    return f"https://www.youtube.com/watch?v={vid}"

def get_random_song(desc):
    d = (desc or "").lower()
    for key, songs in SONG_MAP.items():
        if key in d:
            return random.choice(songs)
    return random.choice(SONG_MAP["clear"])

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        city = request.form.get("city", "").strip()
        if not city:
            flash("City name required.")
            return redirect(url_for("index"))

        if not OPENWEATHER_API_KEY:
            flash("Server not configured (missing API key).")
            return redirect(url_for("index"))

        api = f"https://api.openweathermap.org/data/2.5/weather?q={city}&units=metric&appid={OPENWEATHER_API_KEY}"
        try:
            r = requests.get(api, timeout=8)
        except Exception as e:
            flash("Network error.")
            print("❌ Error:", e)
            return redirect(url_for("index"))

        if r.status_code != 200:
            flash("City not found.")
            return redirect(url_for("index"))

        res = r.json()
        desc = res.get("weather", [{}])[0].get("description", "")
        vid = get_random_song(desc)

        weather = {
            "city": res.get("name"),
            "country": res.get("sys", {}).get("country"),
            "temp": round(res.get("main", {}).get("temp", 0)),
            "desc": desc.title(),
            "humidity": res.get("main", {}).get("humidity"),
            "wind": res.get("wind", {}).get("speed")
        }

        return render_template(
            "dashboard.html",
            weather=weather,
            embed_url=make_embed(vid),
            watch_url=make_watch(vid)
        )

    return render_template("index.html")

# New route: accept latitude & longitude (form POST from client geolocation)
@app.route("/loc", methods=["POST"])
def loc():
    lat = request.form.get("lat")
    lon = request.form.get("lon")
    if not lat or not lon:
        flash("Location coordinates missing.")
        return redirect(url_for("index"))

    if not OPENWEATHER_API_KEY:
        flash("Server not configured (missing API key).")
        return redirect(url_for("index"))

    api = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={OPENWEATHER_API_KEY}"
    try:
        r = requests.get(api, timeout=8)
    except Exception as e:
        flash("Network error.")
        print("❌ Error:", e)
        return redirect(url_for("index"))

    if r.status_code != 200:
        flash("Could not get weather for your location.")
        return redirect(url_for("index"))

    res = r.json()
    desc = res.get("weather", [{}])[0].get("description", "")
    vid = get_random_song(desc)

    weather = {
        "city": res.get("name") or "Current Location",
        "country": res.get("sys", {}).get("country"),
        "temp": round(res.get("main", {}).get("temp", 0)),
        "desc": desc.title(),
        "humidity": res.get("main", {}).get("humidity"),
        "wind": res.get("wind", {}).get("speed")
    }

    return render_template(
        "dashboard.html",
        weather=weather,
        embed_url=make_embed(vid),
        watch_url=make_watch(vid)
    )


if __name__ == "__main__":
    app.run(debug=True)
