"""
Generate Yandex Dzen-compatible RSS feed.
Requirements:
- content:encoded with full article text (min 300 words)
- enclosure with real file size and min 700px image
- category includes format-article
- All images must exist
"""
import os
import re
from pathlib import Path
from html.parser import HTMLParser
from datetime import datetime
from email.utils import format_datetime
from urllib.request import urlopen

BASE_URL = "https://pozitiv-psychology.ru"
IMAGES_DIR = Path("images")

# ── Article content extractor ──────────────────────────────────────────────────
class ArticleExtractor(HTMLParser):
    """Extracts main article content as clean HTML for content:encoded."""
    ALLOWED = {'p','a','b','strong','i','em','u','s','h1','h2','h3','h4',
                'blockquote','ul','ol','li','img','figure','figcaption','br'}
    # Tags whose subtree we entirely skip
    SKIP_TAGS = {'script','style','nav','footer','header','button','form',
                 'input','select','textarea','noscript'}
    # Void elements — they never emit handle_endtag, so must not affect depth
    VOID_TAGS = {'area','base','br','col','embed','hr','img','input','link',
                 'meta','param','source','track','wbr'}
    # Tags that mark the main article body
    ARTICLE_TAGS = {'article','main'}

    def __init__(self):
        super().__init__()
        self.result = []
        self.skip_depth = 0   # >0 means we are inside a SKIP_TAG subtree
        self.in_article = False
        self.article_tag = None  # which tag ('main'/'article') opened the article

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)

        # ── Inside a skip section ────────────────────────────────────────────
        if self.skip_depth > 0:
            if tag not in self.VOID_TAGS:
                self.skip_depth += 1
            return

        # ── Start a new skip section ─────────────────────────────────────────
        if tag in self.SKIP_TAGS:
            if tag not in self.VOID_TAGS:
                self.skip_depth = 1
            return

        # ── Detect article opening ───────────────────────────────────────────
        if tag in self.ARTICLE_TAGS and not self.in_article:
            self.in_article = True
            self.article_tag = tag
            return

        if not self.in_article:
            return

        # ── Emit allowed tags ────────────────────────────────────────────────
        if tag in self.ALLOWED:
            keep = {}
            if tag == 'a':
                href = attr_dict.get('href', '')
                if href:
                    if href.startswith('/'):
                        href = BASE_URL + href
                    keep['href'] = href
            elif tag == 'img':
                src = attr_dict.get('src', '')
                if src:
                    if src.startswith('../images/'):
                        local = src.replace('../images/', 'images/')
                        # Dzen accepts only JPEG/GIF/PNG — replace WebP with JPEG/PNG fallback
                        if local.lower().endswith('.webp'):
                            for ext in ('.jpg', '.jpeg', '.png'):
                                candidate = local[:-5] + ext
                                if Path(candidate).exists():
                                    local = candidate
                                    break
                            else:
                                local = None  # no fallback found, skip image
                        if local:
                            src = BASE_URL + '/' + local
                        else:
                            src = ''
                    elif src.startswith('/'):
                        src = BASE_URL + src
                if src:
                    keep['src'] = src
                alt = attr_dict.get('alt', '')
                if alt:
                    keep['alt'] = alt
                keep['style'] = 'max-width:100%;height:auto;'
            attrs_str = ''.join(f' {k}="{v}"' for k, v in keep.items())
            if tag in ('br', 'img'):
                self.result.append(f'<{tag}{attrs_str}/>')
            else:
                self.result.append(f'<{tag}{attrs_str}>')

    def handle_endtag(self, tag):
        # ── Inside a skip section ────────────────────────────────────────────
        if self.skip_depth > 0:
            self.skip_depth -= 1
            return

        # ── Detect article closing ───────────────────────────────────────────
        if self.in_article and tag == self.article_tag:
            self.in_article = False
            self.article_tag = None
            return

        if not self.in_article:
            return

        # ── Close allowed tags ───────────────────────────────────────────────
        if tag in self.ALLOWED and tag not in ('br', 'img'):
            self.result.append(f'</{tag}>')

    def handle_data(self, data):
        if self.skip_depth or not self.in_article:
            return
        self.result.append(data)

    def get_content(self):
        html = ''.join(self.result)
        # Remove excessive whitespace
        html = re.sub(r'\n{3,}', '\n\n', html)
        html = re.sub(r'[ \t]+', ' ', html)
        # Remove empty tags
        for tag in ('p','h2','h3','h4','li'):
            html = re.sub(fr'<{tag}[^>]*>\s*</{tag}>', '', html)
        return html.strip()


def extract_article_content(filepath):
    try:
        content = Path(filepath).read_text(encoding='utf-8')
    except Exception as e:
        return f'<p>Ошибка чтения статьи: {e}</p>'
    parser = ArticleExtractor()
    parser.feed(content)
    return parser.get_content()


def get_image_size(path):
    try:
        return os.path.getsize(path)
    except:
        return 0


def get_image_mime(path):
    ext = Path(path).suffix.lower()
    return {'png': 'image/png', 'gif': 'image/gif',
            'webp': 'image/webp'}.get(ext.lstrip('.'), 'image/jpeg')


def xml_escape(s):
    return (s.replace('&','&amp;')
             .replace('<','&lt;')
             .replace('>','&gt;')
             .replace('"','&quot;'))


# ── Article definitions ────────────────────────────────────────────────────────
articles = [
    {
        'title': 'Не отсюда, не оттуда: кризис принадлежности эмигранта',
        'url': f'{BASE_URL}/articles/ne-otsyuda-ne-ottyuda.html',
        'file': 'articles/ne-otsyuda-ne-ottyuda.html',
        'date': 'Thu, 03 Apr 2026 10:00:00 +0300',
        'categories': ['Эмиграция', 'Идентичность', 'format-article'],
        'description': 'Почему мы чувствуем себя чужими и там, и здесь. Третья культура, кризис принадлежности и как пройти через него, сохранив себя.',
        'image': 'images/116.jpg',
    },
    {
        'title': 'Денежные сценарии детства: откуда берётся страх бедности',
        'url': f'{BASE_URL}/articles/deneshnye-scenarii-detstva.html',
        'file': 'articles/deneshnye-scenarii-detstva.html',
        'date': 'Wed, 01 Apr 2026 10:00:00 +0300',
        'categories': ['Финансовая психология', 'КПТ', 'format-article'],
        'description': 'Как убеждения о деньгах формируются в детстве, почему они управляют вашей жизнью и как изменить финансовые сценарии.',
        'image': 'images/54.jpg',
    },
    {
        'title': 'Финансовые конфликты в паре: кто платит и почему это не про деньги',
        'url': f'{BASE_URL}/articles/finansovye-konflikty-v-pare.html',
        'file': 'articles/finansovye-konflikty-v-pare.html',
        'date': 'Wed, 01 Apr 2026 12:00:00 +0300',
        'categories': ['Отношения', 'Финансовая психология', 'format-article'],
        'description': 'Почему пары ссорятся из-за денег, как транзактный анализ объясняет финансовые конфликты и три упражнения для пары.',
        'image': 'images/48.png',
    },
    {
        'title': 'Финансовая тревожность в условиях нестабильности: русский способ справляться',
        'url': f'{BASE_URL}/articles/finansovaya-trevozhnost-russkiy-sposob.html',
        'file': 'articles/finansovaya-trevozhnost-russkiy-sposob.html',
        'date': 'Wed, 01 Apr 2026 14:00:00 +0300',
        'categories': ['Исследование', 'Финансовая психология', 'format-article'],
        'description': 'Исследование масштабов, причин и специфики преодоления финансовой тревожности в современной России.',
        'image': 'images/82.jpg',
    },
    {
        'title': 'Упражнения для расслабления и снятия мышечных блоков',
        'url': f'{BASE_URL}/articles/uprazhneniya-dlya-rasslableniya-i-snyatie-myshechnyx-blokov.html',
        'file': 'articles/uprazhneniya-dlya-rasslableniya-i-snyatie-myshechnyx-blokov.html',
        'date': 'Mon, 30 Mar 2026 15:00:00 +0300',
        'categories': ['Телесная терапия', 'Практика', 'format-article'],
        'description': 'Практические техники работы с телесным напряжением и психосоматическими зажимами.',
        'image': 'images/85.jpg',
    },
    {
        'title': 'Групповая терапия: что это, как работает и чем отличается от индивидуальной',
        'url': f'{BASE_URL}/articles/gruppovaya-terapiya-chto-eto.html',
        'file': 'articles/gruppovaya-terapiya-chto-eto.html',
        'date': 'Mon, 30 Mar 2026 14:00:00 +0300',
        'categories': ['Групповая терапия', 'КПТ', 'format-article'],
        'description': 'Групповая терапия — это не «поговорить с незнакомцами». Объясняем, как устроена группа, кому подходит и почему иногда работает лучше индивидуальной.',
        'image': 'images/71.jpg',
    },
    {
        'title': 'ДПДГ (EMDR): что это такое и как работает',
        'url': f'{BASE_URL}/articles/dpdg-emdr-chto-eto.html',
        'file': 'articles/dpdg-emdr-chto-eto.html',
        'date': 'Mon, 30 Mar 2026 10:00:00 +0300',
        'categories': ['ДПДГ', 'Травма', 'format-article'],
        'description': 'Простое объяснение метода переработки травм движениями глаз: кому подходит, как проходит сессия, мифы и реальность.',
        'image': 'images/article-emdr-preview.jpg',
    },
    {
        'title': 'КПТ-терапия: что это такое и как она работает',
        'url': f'{BASE_URL}/articles/kpt-terapiya-chto-eto.html',
        'file': 'articles/kpt-terapiya-chto-eto.html',
        'date': 'Fri, 20 Mar 2026 10:00:00 +0300',
        'categories': ['КПТ', 'Психотерапия', 'format-article'],
        'description': 'Полное руководство по когнитивно-поведенческой терапии: принципы, техники, показания и эффективность метода.',
        'image': 'images/article-kpt-preview.jpg',
    },
    {
        'title': 'Симптомы тревожного расстройства — как распознать',
        'url': f'{BASE_URL}/articles/simptomy-trevozhnogo-rasstroystva.html',
        'file': 'articles/simptomy-trevozhnogo-rasstroystva.html',
        'date': 'Wed, 18 Mar 2026 10:00:00 +0300',
        'categories': ['Тревога', 'Психическое здоровье', 'format-article'],
        'description': 'Как отличить нормальную тревогу от расстройства, основные физические и психологические симптомы тревожного расстройства.',
        'image': 'images/article-trevoga-preview.jpg',
    },
    {
        'title': 'Как выбрать психолога: полное руководство',
        'url': f'{BASE_URL}/blog/kak-vybrat-psikhologa.html',
        'file': 'blog/kak-vybrat-psikhologa.html',
        'date': 'Sat, 14 Mar 2026 10:00:00 +0300',
        'categories': ['Гид', 'Выбор психолога', 'format-article'],
        'description': '7 ключевых вопросов, которые помогут найти своего специалиста и не пожалеть о выборе.',
        'image': 'images/article-vybor-psikhologa-new.jpg',
    },
    {
        'title': 'Как справиться с приступами паники',
        'url': f'{BASE_URL}/articles/kak-spravitsya-s-pristupami-paniki.html',
        'file': 'articles/kak-spravitsya-s-pristupami-paniki.html',
        'date': 'Thu, 19 Mar 2026 10:00:00 +0300',
        'categories': ['Тревога', 'Приступы паники', 'format-article'],
        'description': 'Техники остановки приступа паники: дыхание 4-7-8, заземление 5-4-3-2-1, прогрессивная релаксация.',
        'image': 'images/article-panika-preview.jpg',
    },
    {
        'title': 'Психолог онлайн vs офлайн: что выбрать',
        'url': f'{BASE_URL}/articles/psikholog-onlayn-vs-oflayn.html',
        'file': 'articles/psikholog-onlayn-vs-oflayn.html',
        'date': 'Fri, 20 Mar 2026 14:00:00 +0300',
        'categories': ['Гид', 'Консультации', 'format-article'],
        'description': 'Сравнение форматов, плюсы и минусы онлайн-консультаций, какой вариант лучше для вас.',
        'image': 'images/article-online-offline-preview.jpg',
    },
    {
        'title': 'Когда работа с тревогой превращается в выгорание',
        'url': f'{BASE_URL}/articles/trevozhnoye-utomleniye.html',
        'file': 'articles/trevozhnoye-utomleniye.html',
        'date': 'Tue, 10 Mar 2026 10:00:00 +0300',
        'categories': ['Выгорание', 'Тревога', 'format-article'],
        'description': 'Как распознать тревожное утомление и что с ним делать, чтобы не дойти до полного выгорания.',
        'image': 'images/article-alert-fatigue.jpg',
    },
    {
        'title': 'Почему умные люди попадаются на мошенников',
        'url': f'{BASE_URL}/articles/pochemu-umnye-lyudi-popadayutsya.html',
        'file': 'articles/pochemu-umnye-lyudi-popadayutsya.html',
        'date': 'Sun, 08 Mar 2026 10:00:00 +0300',
        'categories': ['Психология', 'Мошенничество', 'format-article'],
        'description': 'Разбираем психологические механизмы, которые заставляют образованных людей терять деньги.',
        'image': 'images/article-moshenniki.jpg',
    },
    {
        'title': 'Как восстановить доверие к себе после мошенничества',
        'url': f'{BASE_URL}/articles/vosstanovlenie-posle-moshennichestva.html',
        'file': 'articles/vosstanovlenie-posle-moshennichestva.html',
        'date': 'Mon, 09 Mar 2026 10:00:00 +0300',
        'categories': ['Травма', 'Восстановление', 'format-article'],
        'description': 'Пошаговый план восстановления после финансового и психологического шока.',
        'image': 'images/article-vosstanovlenie.jpg',
    },
]

# ── Build RSS ──────────────────────────────────────────────────────────────────
items_xml = []
for a in articles:
    img_path = a['image']
    img_exists = Path(img_path).exists()
    img_url = f"{BASE_URL}/{img_path}" if img_exists else f"{BASE_URL}/images/baner.png"
    img_size = get_image_size(img_path) if img_exists else get_image_size('images/baner.png')

    # Extract full article content
    file_path = a['file']
    if Path(file_path).exists():
        content = extract_article_content(file_path)
        word_count = len(re.sub(r'<[^>]+>', '', content).split())
        print(f"  {file_path}: {word_count} words extracted")
    else:
        content = f'<p>{xml_escape(a["description"])}</p>'
        print(f"  {file_path}: FILE NOT FOUND, using description")

    categories_xml = '\n      '.join(f'<category>{xml_escape(c)}</category>' for c in a['categories'])

    item = f"""    <item>
      <title>{xml_escape(a['title'])}</title>
      <link>{a['url']}</link>
      <guid isPermaLink="true">{a['url']}</guid>
      <pubDate>{a['date']}</pubDate>
      {categories_xml}
      <description>{xml_escape(a['description'])}</description>
      <enclosure url="{img_url}" type="{get_image_mime(img_path if img_exists else 'images/baner.png')}" length="{img_size}" />
      <content:encoded><![CDATA[
        {content}
      ]]></content:encoded>
    </item>"""
    items_xml.append(item)

rss = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Камила Золотова — Психолог КПТ</title>
    <link>{BASE_URL}</link>
    <description>Статьи о психологии, КПТ-терапии, тревоге и психологическом здоровье от психолога Камилы Золотовой</description>
    <language>ru</language>
    <pubDate>Thu, 03 Apr 2026 10:00:00 +0300</pubDate>
    <lastBuildDate>Thu, 03 Apr 2026 10:00:00 +0300</lastBuildDate>
    <atom:link href="{BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>{BASE_URL}/images/logo-kz-flat.jpg</url>
      <title>Камила Золотова — Психолог КПТ</title>
      <link>{BASE_URL}</link>
    </image>

{chr(10).join(items_xml)}

  </channel>
</rss>
"""

Path('rss.xml').write_text(rss, encoding='utf-8')
print(f"\nDone! RSS written with {len(articles)} items")
