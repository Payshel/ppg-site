"""Rebuild the Team section of team.html from _build/team.json.

To add a person: add an entry to the right division's "members" list in team.json
(directors first, then team members in the order they should appear), put a
480x600 photo at img/team/<slug>.jpg, and run:  python3 _build/build_team.py
Folders starting with "_" are not published by GitHub Pages.
"""
import json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
data = json.loads((ROOT / "_build" / "team.json").read_text())
page = (ROOT / "team.html").read_text()


def photo(slug, name):
    if (ROOT / "img" / "team" / f"{slug}.jpg").exists():
        return f'<img src="img/team/{slug}.jpg" alt="{name}">'
    initials = "".join(w[0] for w in name.split()[:2])
    return f'<span class="initials" aria-hidden="true">{initials}</span>'


def creds(p):
    return "".join(f"<li>{c}</li>" for c in p.get("creds", []))


def card(p, cls="member"):
    return f'''          <article class="{cls}">
            <div class="mphoto">{photo(p["slug"], p["name"])}</div>
            <div class="mtext">
              <h3>{p["name"]}</h3>
              <p class="role">{p["title"]}</p>
              <ul class="creds">{creds(p)}</ul>
              <button class="more-btn" type="button" data-open="bio-{p["slug"]}" aria-haspopup="dialog">Learn more</button>
            </div>
          </article>'''


def dialog(p, role_html):
    paras = "".join(f"<p>{x}</p>" for x in p.get("long", []))
    img = f'<img src="img/team/{p["slug"]}.jpg" alt="" width="96" height="120">' if (ROOT / "img" / "team" / f'{p["slug"]}.jpg').exists() else ""
    return f'''<dialog class="bio-modal" id="bio-{p["slug"]}" aria-labelledby="bio-{p["slug"]}-h">
  <div class="bm-head">
    {img}
    <div><h2 id="bio-{p["slug"]}-h">{p["name"]}</h2><p class="role">{role_html}</p></div>
  </div>
  <div class="bm-body">{paras}</div>
  <form method="dialog"><button class="btn btn-navy" type="submit">Close</button></form>
</dialog>'''


pres = data["president"]
out = [f'''  <section class="section" aria-label="Team members">
    <div class="wrap">
      <div class="roster">
        <article class="member lead">
          <div class="mphoto">{photo(pres["slug"], pres["name"])}</div>
          <div class="mtext">
            <h2>{pres["name"]}</h2>
            <p class="role">{pres["title"]}<br><span>{pres["subtitle"]}</span></p>
            <ul class="creds">{creds(pres)}</ul>
            <button class="more-btn" type="button" data-open="bio-{pres["slug"]}" aria-haspopup="dialog">Learn more</button>
          </div>
        </article>
      </div>''']
dialogs = [dialog(pres, f'{pres["title"]}<br><span>{pres["subtitle"]}</span>')]

for d in data["divisions"]:
    did = re.sub(r"[^a-z]+", "-", d["name"].lower()).strip("-")
    n = len(d["members"])
    cards = []
    for i, m in enumerate(d["members"]):
        cards.append(card(m, "member director" if m["title"].startswith("Executive Director") else "member"))
        dialogs.append(dialog(m, f'{m["title"]}<br><span>{d["name"]}</span>'))
    out.append(f'''
      <section class="division" aria-labelledby="div-{did}">
        <div class="div-head">
          <h2 id="div-{did}">{d["name"]}</h2>
          <span class="div-count">{n} {"person" if n == 1 else "people"}</span>
        </div>
        <div class="div-grid">
{chr(10).join(cards)}
        </div>
      </section>''')

out.append('''
      <div class="open-slot join">
        <div>
          <h3>Build with us</h3>
          <p>Contractors, architects, engineers, lenders.</p>
        </div>
        <a href="contact.html">Get in touch</a>
      </div>
    </div>
  </section>
</main>

''' + "\n".join(dialogs) + "\n")

start = page.index('  <section class="section" aria-label="Team members">')
end = page.index("<footer>")
page = page[:start] + "\n".join(out) + "\n" + page[end:]
(ROOT / "team.html").write_text(page)
print("team.html rebuilt:", ", ".join(f'{d["name"]} ({len(d["members"])})' for d in data["divisions"]))
