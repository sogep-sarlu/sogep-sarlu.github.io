#!/usr/bin/env python3
"""Génère les pages de gammes (FR + EN), les cartes de gammes des pages d'accueil et le sitemap.

Usage, depuis la racine du dépôt :  python3 outils/generer.py
Modifier les produits dans outils/gammes.py, puis relancer ce script.
"""
import html, re, sys, urllib.parse, datetime, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from gammes import GAMMES, POLES

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://sogep-sarlu.github.io/"
TEL, TEL_TXT, MAIL = "224626298419", "+224 626 29 84 19", "sogepgnsarl@gmail.com"
FB = "https://www.facebook.com/sogepsarlu"
PDF = "SOGEP-SARLU_Catalogue_2026.pdf?v=4"
TODAY = datetime.date.today().isoformat()
e = lambda s: html.escape(s, quote=True)

WA_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.2a.5.5 0 0 0 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>'

T = {
    "fr": dict(
        lang="fr", locale="fr_FR", home="", gdir="gammes/", slug="slug", name="fr", desc="desc", alt="alt", seo="seo",
        tagline="Solutions globales d'équipements et de prestations",
        nav=[("#presentation", "Présentation"), ("#gammes", "Nos gammes"), ("#services", "Comment commander"), ("#engagements", "Engagements"), ("catalogue.html", "Catalogue"), ("#contact", "Contact")],
        cta="Demander une cotation", cta2="Écrivez-nous →", menu_open="Ouvrir le menu", menu_close="Fermer le menu", menu_label="Menu principal",
        other_lang="English", other_code="en",
        crumbs_home="Accueil", crumbs_label="Fil d'Ariane", crumbs_g="Nos gammes", gamme="Gamme",
        lead_extra="Livraison gratuite partout à Conakry, intérieur du pays sur devis. Prix sur facture pro-forma en francs guinéens, valable 30 jours.",
        wa_btn="Demander une cotation sur WhatsApp", wa_alt="Ouvrir WhatsApp →", pdf_btn="Télécharger le catalogue", pdf_alt="PDF · 15 pages →",
        list_h="Articles fournis régulièrement", list_p="Un aperçu des articles que nous livrons à nos clients. Tout autre article de la gamme est fourni sur demande.",
        th=("Désignation", "Spécification ou référence", "Unité"),
        absent_h="Un article absent de la liste ?",
        absent_p="Envoyez-nous la désignation, la référence constructeur ou une photo de la pièce : nous la recherchons, l'importons si besoin et vous adressons une offre pro-forma.",
        how_h="Comment commander",
        steps=[("Demande", "Votre liste ou votre besoin, par WhatsApp ou par e-mail."), ("Offre pro-forma", "Une facture pro-forma détaillée, valable 30 jours."), ("Bon de commande", "Vous validez l'offre par votre bon de commande."), ("Livraison", "Avec un bon de livraison signé à la réception."), ("Facturation", "Facture définitive conforme au SYSCOHADA.")],
        others_h="Nos autres gammes", all_g="Voir toutes les gammes",
        contact_h="Une demande pour cette gamme ?", contact_p="Envoyez-nous votre liste : nous répondons avec une offre pro-forma détaillée.",
        tel_l="Téléphone et WhatsApp", mail_l="E-mail", fb_l="Facebook",
        wa_msg="Bonjour SOGEP-SARLU, je souhaite une cotation pour la gamme « {g} ».",
        foot_photo="Photographies d'illustration, non contractuelles.", foot_cat="Catalogue 2026",
        card_more="Voir les articles", card_back="Retour", card_page="Page de la gamme",
        title_suffix="SOGEP-SARLU, Conakry",
        h_sub="Livraison gratuite à Conakry",
        skip="Aller au contenu",
    ),
    "en": dict(
        lang="en", locale="en_GB", home="en/", gdir="en/ranges/", slug="slug_en", name="en", desc="desc_en", alt="alt_en", seo="seo_en",
        tagline="Global equipment and services solutions",
        nav=[("#presentation", "About"), ("#gammes", "Product ranges"), ("#services", "How to order"), ("#engagements", "Commitments"), ("../catalogue.html", "Catalogue"), ("#contact", "Contact")],
        cta="Request a quote", cta2="Write to us →", menu_open="Open menu", menu_close="Close menu", menu_label="Main menu",
        other_lang="Français", other_code="fr",
        crumbs_home="Home", crumbs_label="Breadcrumb", crumbs_g="Product ranges", gamme="Range",
        lead_extra="Free delivery anywhere in Conakry; delivery upcountry on quotation. Prices on a pro forma invoice in Guinean francs, valid for 30 days.",
        wa_btn="Request a quote on WhatsApp", wa_alt="Open WhatsApp →", pdf_btn="Download the catalogue", pdf_alt="PDF in French · 15 pages →",
        list_h="Items we supply regularly", list_p="A selection of the items we deliver to our clients. Any other item in this range is supplied on request.",
        th=("Item", "Specification or part number", "Unit"),
        absent_h="Can't see the item you need?",
        absent_p="Send us the description, the manufacturer's part number or a photo of the part: we source it, import it if needed and send you a pro forma offer.",
        how_h="How to order",
        steps=[("Request", "Your list or requirement, by WhatsApp or email."), ("Pro forma offer", "A detailed pro forma invoice, valid for 30 days."), ("Purchase order", "You confirm the offer with your purchase order."), ("Delivery", "With a delivery note signed on receipt."), ("Invoicing", "Final invoice compliant with SYSCOHADA.")],
        others_h="Our other ranges", all_g="See all ranges",
        contact_h="A request for this range?", contact_p="Send us your list and we will reply with a detailed pro forma offer.",
        tel_l="Phone and WhatsApp", mail_l="Email", fb_l="Facebook",
        wa_msg="Hello SOGEP-SARLU, I would like a quote for the \"{g}\" range.",
        foot_photo="Illustrative photographs, not contractual.", foot_cat="2026 catalogue (French)",
        card_more="See the items", card_back="Back", card_page="Range page",
        title_suffix="SOGEP-SARLU, Conakry, Guinea",
        h_sub="Free delivery in Conakry",
        skip="Skip to content",
    ),
}


def url_of(lang, g=None):
    t = T[lang]
    return SITE + (t["gdir"] + g[t["slug"]] + ".html" if g else t["home"])


def header(lang, depth, alt_href, home_href):
    t = T[lang]
    up = "../" * depth
    nav = []
    for href, label in t["nav"]:
        if href.startswith("#"):
            href = home_href + href
        elif lang == "en" and href.startswith("../"):
            href = up + href[3:]
        else:
            href = up + href
        nav.append(f'<a href="{e(href)}">{e(label)}</a>')
    nav.append(f'<a class="lang" href="{e(alt_href)}" hreflang="{t["other_code"]}" lang="{t["other_code"]}">{t["other_lang"]}</a>')
    return f'''<a class="skip" href="#contenu">{t["skip"]}</a>
<header class="top">
  <div class="wrap">
    <a class="brand" href="{e(home_href or "./")}"><img src="{up}icon.png" alt="" width="42" height="42"><span><b>SOGEP-SARLU</b><small>{e(t["tagline"])}</small></span></a>
    <nav class="menu" id="menu" aria-label="{t["menu_label"]}">
      {(chr(10) + "      ").join(nav)}
    </nav>
    <a class="btn btn-gold hdr-cta" href="#contact"><span class="slide"><span>{t["cta"]}</span><span aria-hidden="true">{t["cta2"]}</span></span></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu" aria-label="{t["menu_open"]}" data-open="{t["menu_open"]}" data-close="{t["menu_close"]}"><span></span><span></span><span></span></button>
  </div>
</header>'''


def footer(lang, depth):
    t = T[lang]; up = "../" * depth
    return f'''<footer>
  <div class="wrap">
    <span>SOGEP-SARLU · SARLU · RCCM GN.TCC.2026.B.05461 · NIF 222677627 · Ecobank Guinée SA</span>
    <span>{t["foot_photo"]} · <a href="{up}catalogue.html">{t["foot_cat"]}</a> · <a href="{FB}" target="_blank" rel="noopener">Facebook</a></span>
  </div>
</footer>
<a class="wa-float" href="https://wa.me/{TEL}" target="_blank" rel="noopener" aria-label="WhatsApp SOGEP-SARLU"><svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{WA_ICON.split('aria-hidden="true">')[1].replace("</svg>", "")}</svg></a>'''


def head(lang, title, desc, canonical, alt_url, depth, img, extra_ld):
    t = T[lang]; up = "../" * depth
    fr_url, en_url = (canonical, alt_url) if lang == "fr" else (alt_url, canonical)
    return f'''<!doctype html>
<html lang="{t["lang"]}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{canonical}">
<link rel="alternate" hreflang="fr" href="{fr_url}">
<link rel="alternate" hreflang="en" href="{en_url}">
<link rel="alternate" hreflang="x-default" href="{fr_url}">
<link rel="icon" href="{up}icon.png">
<link rel="apple-touch-icon" href="{up}icon.png">
<meta name="theme-color" content="#0E1A30">
<meta property="og:type" content="website">
<meta property="og:locale" content="{t["locale"]}">
<meta property="og:site_name" content="SOGEP-SARLU">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{SITE}{img}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
{extra_ld}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,500..900&family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap">
<link rel="stylesheet" href="{up}css/site.css?v=6">
</head>'''


def gamme_page(lang, g):
    t = T[lang]
    depth = 1 if lang == "fr" else 2
    up = "../" * depth
    other = "en" if lang == "fr" else "fr"
    canonical, alt_url = url_of(lang, g), url_of(other, g)
    home_href = up + T[lang]["home"]
    alt_href = up + T[other]["gdir"] + g[T[other]["slug"]] + ".html"
    name, desc = g[t["name"]], g[t["desc"]]
    pole = POLES[g["pole"]][0 if lang == "fr" else 1]
    title = f'{name} · {t["title_suffix"]}'
    wa = f'https://wa.me/{TEL}?text=' + urllib.parse.quote(t["wa_msg"].format(g=name))
    ld = {
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": t["crumbs_home"], "item": url_of(lang)},
                {"@type": "ListItem", "position": 2, "name": t["crumbs_g"], "item": url_of(lang) + "#gammes"},
                {"@type": "ListItem", "position": 3, "name": name, "item": canonical}]},
            {"@type": "OfferCatalog", "name": name, "url": canonical, "description": g[t["seo"]],
             "provider": {"@type": "LocalBusiness", "name": "SOGEP-SARLU", "url": SITE, "telephone": "+" + TEL},
             "itemListElement": [{"@type": "Offer", "itemOffered": {"@type": "Product", "name": it[0 if lang == "fr" else 3], "description": it[1 if lang == "fr" else 4]}} for it in g["items"]]},
        ],
    }
    import json
    ld = json.dumps(ld, ensure_ascii=False, separators=(",", ":"))
    i0 = 0 if lang == "fr" else 3
    rows = "\n".join(f'          <tr><td data-spec="{e(it[i0+1])}">{e(it[i0])}</td><td>{e(it[i0+1])}</td><td>{e(it[i0+2])}</td></tr>' for it in g["items"])
    steps = "\n".join(f'        <li><span class="dot">{i+1:02d}</span><b>{e(a)}</b><p>{e(b)}</p></li>' for i, (a, b) in enumerate(t["steps"]))
    others = "\n".join(
        f'      <a class="og" href="{e(o[t["slug"]])}.html"><span class="num">{o["num"]}</span><span>{e(o[t["name"]])}</span></a>'
        for o in GAMMES if o is not g)
    return f'''{head(lang, title, g[t["seo"]], canonical, alt_url, depth, g["img"], ld)}
<body class="gpage">
{header(lang, depth, alt_href, home_href)}

<main id="contenu">
<section class="ghero dark">
  <div class="wrap">
    <div class="ghero-copy">
      <nav class="crumbs" aria-label="{t['crumbs_label']}"><a href="{e(home_href or "./")}">{t["crumbs_home"]}</a><span aria-hidden="true">›</span><a href="{e((home_href or "./") + "#gammes")}">{t["crumbs_g"]}</a><span aria-hidden="true">›</span><span aria-current="page">{e(name)}</span></nav>
      <span class="kicker">{t["gamme"]} {g["num"]} · {e(pole)}</span>
      <h1>{e(name)}</h1>
      <p class="lead">{e(desc)} {e(t["lead_extra"])}</p>
      <div class="acts">
        <a class="btn btn-gold" href="{e(wa)}" target="_blank" rel="noopener"><span class="slide"><span>{t["wa_btn"]}</span><span aria-hidden="true">{t["wa_alt"]}</span></span></a>
        <a class="btn btn-ghost" href="{up}{PDF}" download><span class="slide"><span>{t["pdf_btn"]}</span><span aria-hidden="true">{t["pdf_alt"]}</span></span></a>
      </div>
    </div>
    <figure><img src="{up}{g["img"]}" alt="{e(g[t["alt"]])}" width="750" height="500" fetchpriority="high"></figure>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="head"><span class="kicker">{t["gamme"]} {g["num"]}</span><h2>{t["list_h"]}</h2><p>{t["list_p"]}</p></div>
    <div class="gtable">
      <table>
        <thead><tr><th scope="col">{t["th"][0]}</th><th scope="col">{t["th"][1]}</th><th scope="col">{t["th"][2]}</th></tr></thead>
        <tbody>
{rows}
        </tbody>
      </table>
    </div>
    <div class="more">
      <div><h3>{t["absent_h"]}</h3><p>{t["absent_p"]}</p></div>
      <a class="btn btn-gold" href="{e(wa)}" target="_blank" rel="noopener"><span class="slide"><span>{WA_ICON}WhatsApp</span><span aria-hidden="true">{TEL_TXT}</span></span></a>
    </div>
  </div>
</section>

<section class="sec stone">
  <div class="wrap">
    <div class="head"><h2>{t["how_h"]}</h2></div>
    <div class="steps-wrap static">
      <ol class="steps">
{steps}
      </ol>
    </div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="head"><h2>{t["others_h"]}</h2></div>
    <div class="others">
{others}
    </div>
    <p style="margin-top:22px"><a class="all" href="{e((home_href or "./") + "#gammes")}">{t["all_g"]} →</a></p>
  </div>
</section>

<section class="gcontact dark" id="contact">
  <div class="wrap">
    <div><h2>{t["contact_h"]}</h2><p class="lead">{t["contact_p"]}</p></div>
    <div class="coords">
      <div class="coord"><div><small>{t["tel_l"]}</small><a href="https://wa.me/{TEL}" target="_blank" rel="noopener">{TEL_TXT}</a></div></div>
      <div class="coord"><div><small>{t["mail_l"]}</small><a href="mailto:{MAIL}">{MAIL}</a></div></div>
      <div class="coord"><div><small>{t["fb_l"]}</small><a href="{FB}" target="_blank" rel="noopener">facebook.com/sogepsarlu</a></div></div>
    </div>
  </div>
</section>
</main>

{footer(lang, depth)}
<script src="{up}js/page.js?v=2"></script>
</body>
</html>
'''


def cards(lang):
    """Cartes retournables des gammes pour la page d'accueil."""
    t = T[lang]
    i0 = 0 if lang == "fr" else 3
    out = []
    for key, (pfr, pen) in POLES.items():
        gs = [g for g in GAMMES if g["pole"] == key]
        rng = f'{"Gammes" if lang == "fr" else "Ranges"} {gs[0]["num"]} – {gs[-1]["num"]}'
        cls = "cards five" if len(gs) == 5 else "cards"
        arts = []
        for g in gs:
            gurl = (T[lang]["gdir"].split("/", 1)[1] if lang == "en" else T[lang]["gdir"]) + g[t["slug"]] + ".html"
            rows = "".join(f'<tr><td>{e(it[i0])}<small>{e(it[i0+1])}</small></td><td>{e(it[i0+2])}</td></tr>' for it in g["items"])
            img = ("../" if lang == "en" else "") + g["img"]
            arts.append(f'''<article class="flip" id="g{g["num"]}">
  <div class="inner">
    <div class="face front"><figure><img src="{img}" alt="{e(g[t["alt"]])}" loading="lazy" width="750" height="500"></figure>
      <div class="body"><span class="num">{g["num"]}</span><h4><a class="glink" href="{gurl}">{e(g[t["name"]])}</a></h4><p class="desc">{e(g[t["desc"]])}</p>
      <button class="turn" type="button" aria-expanded="false">{t["card_more"]} <span aria-hidden="true">↻</span></button></div></div>
    <div class="face back"><h4>{g["num"]} · {e(g[t["name"]])}</h4><table><tbody>{rows}</tbody></table>
      <div class="back-acts"><a class="gpage-link" href="{gurl}">{t["card_page"]} →</a><button class="turn" type="button" aria-expanded="true">{t["card_back"]} <span aria-hidden="true">↺</span></button></div></div>
  </div>
</article>''')
        out.append(f'<div class="pole"><div class="pole-h"><h3>{e(pfr if lang == "fr" else pen)}</h3><small>{rng}</small></div><div class="{cls}">' + "".join(arts) + '</div></div>')
    return "\n".join(out)


def inject(path, block):
    p = ROOT / path
    s = p.read_text(encoding="utf-8")
    s2, n = re.subn(r"<!-- GAMMES:DEBUT -->.*?<!-- GAMMES:FIN -->", lambda m: "<!-- GAMMES:DEBUT -->\n" + block + "\n<!-- GAMMES:FIN -->", s, flags=re.S)
    assert n == 1, f"marqueurs GAMMES absents dans {path}"
    p.write_text(s2, encoding="utf-8")


def sitemap():
    urls = [("", "en/", "1.0"), ("catalogue.html", None, "0.6")]
    urls += [(T["fr"]["gdir"] + g["slug"] + ".html", T["en"]["gdir"] + g["slug_en"] + ".html", "0.8") for g in GAMMES]
    parts = []
    for fr, en, prio in urls:
        for loc, alt in ((fr, en), (en, fr)) if en else ((fr, None),):
            alts = ""
            if alt is not None:
                frl, enl = (loc, alt) if loc == fr else (alt, loc)
                alts = (f'\n    <xhtml:link rel="alternate" hreflang="fr" href="{SITE}{frl}"/>'
                        f'\n    <xhtml:link rel="alternate" hreflang="en" href="{SITE}{enl}"/>')
            parts.append(f'  <url>\n    <loc>{SITE}{loc}</loc>\n    <lastmod>{TODAY}</lastmod>\n    <priority>{prio}</priority>{alts}\n  </url>')
    (ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + "\n".join(parts) + "\n</urlset>\n", encoding="utf-8")


if __name__ == "__main__":
    for lang in ("fr", "en"):
        d = ROOT / T[lang]["gdir"]
        d.mkdir(parents=True, exist_ok=True)
        for g in GAMMES:
            (d / (g[T[lang]["slug"]] + ".html")).write_text(gamme_page(lang, g), encoding="utf-8")
    inject("index.html", cards("fr"))
    if (ROOT / "en/index.html").exists():
        inject("en/index.html", cards("en"))
    sitemap()
    print("Pages générées :", 2 * len(GAMMES), "· sitemap mis à jour")
