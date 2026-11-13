// Тематическая колода «Деньги и тревога» (12 карт). Строгий JSON: его читают и браузер, и tools/generate_cards.py.
// Общие промпты стиля берутся из базовой колоды (cards.js). Картинки: cards/money/01.webp … 12.webp.
// codes — хеши кодов доступа (их создаёт tools/make_codes.py; сами коды здесь не хранятся).
(window.ARHIV_EXTRA_DECKS = window.ARHIV_EXTRA_DECKS || []).push({
  "id": "money",
  "name": "Деньги и тревога",
  "title": "Ассоциативная карта: деньги и тревога",
  "tagline": "Образы о том, что вы чувствуете, когда думаете о деньгах: откуда это отношение, где в нём тревога и что можно изменить.",
  "access": "paid",
  "price": 390,
  "imageDir": "cards/money/",
  "imageExt": "webp",
  "imageVersion": "20261114a",
  "questions": [
    "Что я чувствую, когда думаю о деньгах?",
    "Откуда у меня такое отношение к деньгам?",
    "Что мне сейчас нужно в вопросах денег?"
  ],
  "groups": {
    "roots": "Откуда это у меня",
    "feelings": "Что я чувствую",
    "next": "Что можно изменить"
  },
  "preview": [
    1,
    6,
    11
  ],
  "codes": [],
  "cards": [
    {
      "id": 1,
      "group": "roots",
      "title": "Копилка",
      "kind": "object",
      "motif": "teapot",
      "hue": 2,
      "people": false,
      "desc": "Старая керамическая копилка на кухонном подоконнике в сумерках. Из щели для монет льётся золотой свет, рядом детский рисунок.",
      "scene": "a large old ceramic piggy bank on a kitchen windowsill at dusk, golden light seeping out of its coin slot, a child's drawing pinned beside the window",
      "q": "Что вы слышали о деньгах в детстве: какими словами и каким тоном?",
      "step": "Если хотите, запишите три фразы о деньгах из детства. Рядом отметьте: это моя мысль или чужая?",
      "verse": [
        "В старой копилке не только монеты:",
        "там звучат чужие голоса."
      ]
    },
    {
      "id": 2,
      "group": "roots",
      "title": "Наследство",
      "kind": "object",
      "motif": "suitcase",
      "hue": 3,
      "people": false,
      "desc": "Тяжёлое старое пальто на крючке в пустой прихожей. Из карманов сыплются золотые монеты и гладкие камешки.",
      "scene": "a heavy old coat hanging on a hook in an empty hallway, golden coins and small smooth stones spilling softly from its pockets",
      "q": "Какие «правила» о деньгах вы получили в наследство?",
      "step": "Если хотите, выберите одно правило и спросите себя: помогает ли оно мне сейчас?",
      "verse": [
        "Пальто досталось по наследству.",
        "В карманах — и золото, и камни."
      ]
    },
    {
      "id": 3,
      "group": "roots",
      "title": "Три ладони",
      "kind": "hands",
      "motif": "knot",
      "hue": 0,
      "people": true,
      "desc": "Три ладони разного возраста: детская, взрослая и пожилая. Каждая держит золотую монету по-своему.",
      "scene": "three hands of different ages, a child's, an adult's and an elderly one, rising one above another from the bottom of the frame, each holding a golden coin in a different way, soft diffused light",
      "q": "Как относились к деньгам мама, папа, бабушка — и что из этого повторяете вы?",
      "step": "Если хотите, нарисуйте схему: кто как относился к деньгам. Отметьте то, что узнаёте в себе.",
      "verse": [
        "Три ладони держат по монете,",
        "и каждая держит её по-своему."
      ]
    },
    {
      "id": 4,
      "group": "roots",
      "title": "Эхо",
      "kind": "object",
      "motif": "shell",
      "hue": 4,
      "people": false,
      "desc": "Открытый пустой кошелёк на деревянном столе. От него расходятся золотые круги, как эхо, а из шва пробивается росток.",
      "scene": "an open empty leather wallet on a wooden table in a quiet room, soft golden rings of light spreading from it like an echo, a tiny green sprout growing from its seam",
      "q": "Какой голос звучит в вас, когда вы открываете кошелёк?",
      "step": "Если хотите, ответьте этому голосу одной доброй фразой.",
      "verse": [
        "Пустой кошелёк тоже отзывается эхом.",
        "Важно, чей это голос."
      ]
    },
    {
      "id": 5,
      "group": "feelings",
      "title": "Дыра в кармане",
      "kind": "symbol",
      "motif": "stone",
      "hue": 5,
      "people": false,
      "desc": "Карман с дырой, из которой, как песок, сыплются золотые монеты и растекаются блестящей рекой по тихому полю.",
      "scene": "a coat pocket with a hole from which golden coins pour out like sand, forming a small shining river that winds across a quiet field",
      "q": "Что вы чувствуете, когда замечаете, куда уходят деньги?",
      "step": "Если хотите, несколько дней отмечайте рядом с тратами чувства: тревога, радость, скука, усталость. Цель — заметить, а не оценить себя.",
      "verse": [
        "Сквозь дыру в кармане течёт река.",
        "Куда она впадает?"
      ]
    },
    {
      "id": 6,
      "group": "feelings",
      "title": "Пустая чаша",
      "kind": "animal",
      "motif": "island",
      "hue": 1,
      "people": false,
      "desc": "Огромная пустая деревянная чаша в поле на рассвете. На её краю сидит маленькая птица и поёт.",
      "scene": "a huge empty wooden bowl standing in a wide field at sunrise, a small bird sitting on its rim and singing",
      "q": "Что для вас «достаточно»: сумма, ощущение, образ жизни?",
      "step": "Если хотите, опишите одной фразой, что для вас «достаточно». Не цифрой, а ощущением.",
      "verse": [
        "Чаша пуста, но на краю — птица,",
        "и она поёт."
      ]
    },
    {
      "id": 7,
      "group": "feelings",
      "title": "Весы",
      "kind": "symbol",
      "motif": "hourglass",
      "hue": 4,
      "people": false,
      "desc": "Весы на лугу: на одной чаше золотая монета, на другой полевой цветок. Они в равновесии.",
      "scene": "a balance scale standing in a meadow, one pan holding a golden coin and the other a blooming wildflower, perfectly balanced",
      "q": "Что для вас дороже — и что вы готовы за это отдать?",
      "step": "Если хотите, вспомните последнюю крупную трату. Что лежало на другой чаше весов?",
      "verse": [
        "На одной чаше — монета,",
        "на другой — цветок.",
        "Они уравновешены."
      ]
    },
    {
      "id": 8,
      "group": "feelings",
      "title": "Свет сквозь пальцы",
      "kind": "person",
      "motif": "shell",
      "hue": 3,
      "people": true,
      "desc": "Молодая женщина прикрывает ладонью светящуюся золотую монету. Свет пробивается сквозь пальцы, на лице лёгкое смущение.",
      "scene": "a young woman in a simple dress covers a glowing golden coin in her palm with her other hand, the light shining between her fingers, a shy and slightly embarrassed expression, soft diffused light",
      "q": "Что вызывает у вас неловкость или страх в отношении денег: иметь, не иметь, просить, тратить?",
      "step": "Если хотите, назовите про себя одно чувство, связанное с деньгами, как сказал бы добрый друг: «Мне неловко, и это можно».",
      "verse": [
        "Монета светится сквозь пальцы.",
        "Её можно держать открыто."
      ]
    },
    {
      "id": 9,
      "group": "next",
      "title": "Принять",
      "kind": "person",
      "motif": "door",
      "hue": 0,
      "people": true,
      "desc": "Женщина сидит за столом у открытого окна. Снаружи к ней тянется рука с маленькой золотой чашей, а она раскрывает ладони с удивлённой мягкой улыбкой.",
      "scene": "a woman sits at a wooden table by an open window, a hand reaching in from outside offers her a small golden bowl, she opens her palms toward it with a surprised gentle smile",
      "q": "Что вам труднее всего принимать: деньги, помощь, подарки, похвалу?",
      "step": "Если получится, сегодня примите одно «спасибо» без отказа и оправданий.",
      "verse": [
        "Чтобы принять, нужны открытые ладони.",
        "Не кулак — ладонь."
      ]
    },
    {
      "id": 10,
      "group": "next",
      "title": "Росток",
      "kind": "nature",
      "motif": "fence",
      "hue": 1,
      "people": false,
      "desc": "Крупный план: золотая монета в тёмной земле, из неё растёт зелёный росток. Рядом маленькая лейка.",
      "scene": "extreme close-up macro of a golden coin buried in dark soil with a small green sprout growing from it, a small watering can beside it, soft morning light",
      "q": "Что вы готовы «посадить» сегодня ради будущего?",
      "step": "Если хотите, подумайте об одном маленьком шаге, который сделал бы ситуацию с деньгами для вас чуть спокойнее, и о том, когда его можно сделать. Это повод подумать, а не финансовый совет.",
      "verse": [
        "Монета в земле. Росток.",
        "Время тоже умеет работать."
      ]
    },
    {
      "id": 11,
      "group": "next",
      "title": "Один стол",
      "kind": "pair",
      "motif": "table",
      "hue": 2,
      "people": true,
      "desc": "Мужчина и женщина за одним столом. У каждого своя маленькая банка с монетами, а между ними большая общая, тихо светится. Они смотрят друг на друга спокойно и доверительно.",
      "scene": "a man and a woman sit at one wooden table, each with their own small jar of coins, between them a larger shared jar glowing softly, they look at each other with calm trust",
      "q": "Как вы говорите о деньгах с близкими — и о чём молчите?",
      "step": "Если с этим человеком безопасно говорить о деньгах, можно выбрать один вопрос и задать его спокойно. Если нет, подумайте, с кем говорить безопаснее.",
      "verse": [
        "У каждого — своя банка.",
        "Но стол — один."
      ]
    },
    {
      "id": 12,
      "group": "next",
      "title": "Спокойный день",
      "kind": "animal",
      "motif": "windows",
      "hue": 5,
      "people": false,
      "desc": "Открытое окно в золотое поле. На подоконнике хлеб, маленькая банка с монетами и спящий на солнце кот.",
      "scene": "an open window onto a golden field, on the windowsill a loaf of bread, a small jar of coins and a sleeping cat in the sun",
      "q": "Каким был бы день, в котором вы спокойны насчёт денег?",
      "step": "Если хотите, опишите такой день в пяти строках: утро, дела, вечер.",
      "verse": [
        "Хлеб, монета и спящий кот",
        "на одном подоконнике."
      ]
    }
  ],
  "note": "Эта колода про чувства, связанные с деньгами. Это не финансовый и не психотерапевтический совет. Если у вас долги, угроза безопасности или очень тяжёлое состояние, обратитесь к специалисту."
});
