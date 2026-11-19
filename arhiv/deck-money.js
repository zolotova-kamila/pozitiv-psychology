// Тематическая колода «Деньги и тревога» (30 карт). Строгий JSON: его читают и браузер, и tools/generate_cards.py.
// Общие промпты стиля берутся из базовой колоды (cards.js). Картинки: cards/money/01.webp … 30.webp.
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
  "imageVersion": "20261119a",
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
      "desc": "Молодая женщина держит на раскрытой ладони маленькую монету и смотрит на неё с робкой, чуть смущённой полуулыбкой.",
      "scene": "a young woman holds a small coin in her open palm and looks at it with a shy, slightly embarrassed half-smile, warm and a little uncertain, soft diffused light",
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
    },
    {
      "id": 13,
      "group": "feelings",
      "title": "Счета",
      "kind": "object",
      "motif": "table",
      "hue": 4,
      "people": false,
      "desc": "Деревянный кухонный стол: аккуратная стопка счетов, маленький калькулятор, карандаш и чашка чая. Из окна падает мягкий утренний свет.",
      "scene": "a wooden kitchen table with a neat stack of bills, a small calculator, a pencil and a cup of tea, soft morning light from the window",
      "q": "Что вы чувствуете, когда видите платёжки и счета? Где это ощущается в теле?",
      "step": "Если хотите, выберите один счёт и спросите себя: что в нём пугает больше, сумма или неизвестность?",
      "verse": [
        "Бумаги на столе лежат тихо.",
        "Громче всего то, что в голове."
      ]
    },
    {
      "id": 14,
      "group": "feelings",
      "title": "Доски через ручей",
      "kind": "landscape",
      "motif": "bridge",
      "hue": 1,
      "people": false,
      "desc": "Старый деревянный мостик через тихий ручей. Некоторых досок не хватает, вдоль мостика натянут канат-перила.",
      "scene": "an old wooden plank footbridge across a quiet stream with a few planks missing and a rope handrail, soft pastel light",
      "q": "Как вы живёте с неровным доходом? Что помогает держать равновесие, а что выбивает из него?",
      "step": "Если хотите, назовите одну «доску», на которую вы опираетесь точно: человека, навык или привычку.",
      "verse": [
        "Не все доски на месте.",
        "И всё же по мостику ходят."
      ]
    },
    {
      "id": 15,
      "group": "feelings",
      "title": "Полка в кладовой",
      "kind": "object",
      "motif": "suitcase",
      "hue": 3,
      "people": false,
      "desc": "Кладовая: на полке несколько банок с заготовками и полупустой тканевый мешок с мукой. Рядом старый деревянный половник, из окна падает мягкий свет.",
      "scene": "a pantry shelf with a few jars of preserves and a half-full cloth bag of flour, a worn wooden ladle, soft window light",
      "q": "Что для вас значит «запас»? Какое чувство появляется, когда он уменьшается?",
      "step": "Если хотите, подумайте, что именно вам нужно, чтобы чувствовать себя в безопасности: не сумма, а что вы тогда сможете делать.",
      "verse": [
        "Полка не полная и не пустая.",
        "Вопрос в том, сколько нужно, чтобы дышать."
      ]
    },
    {
      "id": 16,
      "group": "roots",
      "title": "Ключ в замке",
      "kind": "symbol",
      "motif": "door",
      "hue": 0,
      "people": false,
      "desc": "Старый латунный ключ, наполовину повёрнутый в замке простой деревянной двери; из-под двери идёт полоска тёплого золотого света.",
      "scene": "close-up of an old brass key halfway turned in the lock of a plain wooden door, a thin line of warm golden light spilling from the crack beneath the door, soft pastel wall",
      "q": "Кому, как вам кажется, можно иметь достаток, и чем вы от этих людей отличаетесь?",
      "step": "Если хотите, закончите про себя фразу: «Мне можно иметь деньги, потому что…». Даже если звучит неубедительно.",
      "verse": [
        "Ключ уже в замке.",
        "Дверь не заперта, она просто закрыта."
      ]
    },
    {
      "id": 17,
      "group": "roots",
      "title": "Подарок или счёт",
      "kind": "pair",
      "motif": "table",
      "hue": 1,
      "people": true,
      "desc": "Пожилая женщина и маленькая девочка за столом: между ними ломоть хлеба и одна монета. Они смотрят друг на друга тепло и задумчиво.",
      "scene": "an elderly woman and a little girl sit at a kitchen table, between them a slice of bread and a single coin, they look at each other with a quiet, warm and thoughtful expression, soft golden window light",
      "q": "Как в вашей семье показывали любовь: через деньги, заботу, подарки, их отсутствие? Что вы тогда решили о себе?",
      "step": "Если хотите, вспомните один случай из детства, связанный с деньгами и любовью, и скажите той девочке или тому мальчику доброе слово.",
      "verse": [
        "Хлеб и монета на одном столе.",
        "Любовь и счёт можно развести."
      ]
    },
    {
      "id": 18,
      "group": "roots",
      "title": "Соль на столе",
      "kind": "object",
      "motif": "shell",
      "hue": 2,
      "people": false,
      "desc": "Льняной мешочек крупной соли на деревенском столе рядом с караваем и миской тёплого супа; через стол проходит луч дневного солнца.",
      "scene": "a small linen pouch of coarse salt on a rustic wooden table beside a loaf of bread and a bowl of warm soup, a ray of afternoon sun crossing the table, soft pastel kitchen",
      "q": "Что для вас значит «достаточно» в самом простом смысле: еда, тепло, крыша? Что из этого у вас уже есть?",
      "step": "Если хотите, назовите три простые вещи, которые у вас сегодня уже есть и на которых держится ваш день.",
      "verse": [
        "Хлеб, соль, тёплая миска.",
        "Дом начинается с малого."
      ]
    },
    {
      "id": 19,
      "group": "roots",
      "title": "Муравьиная тропа",
      "kind": "animal",
      "motif": "hive",
      "hue": 3,
      "people": false,
      "desc": "Крупный план: вереница крошечных муравьёв несёт золотые зёрнышки по изогнутой травинке, один отдыхает на капле росы.",
      "scene": "extreme close-up macro of a line of tiny ants carrying small golden seeds along a curved blade of grass, one ant resting on a dewdrop, warm morning light, pastel haze in the background",
      "q": "Откуда у вас убеждение, что нужно работать без передышки, чтобы быть в безопасности? Чей это голос?",
      "step": "Если хотите, отметьте сегодня одно место для маленькой остановки, как капля росы для муравья, и позвольте себе её.",
      "verse": [
        "Зёрнышко за зёрнышком.",
        "Даже у тропы есть капля росы."
      ]
    },
    {
      "id": 20,
      "group": "roots",
      "title": "Два ключа",
      "kind": "hands",
      "motif": "thread",
      "hue": 4,
      "people": true,
      "desc": "Крупный план: две руки передают друг другу связку из двух ключей; одна ладонь открыта, другая принимает.",
      "scene": "close-up of two hands passing a ring with two small keys from one open palm to another, gentle and calm gesture, soft diffused golden light, pastel background",
      "q": "Что для вас значит зависеть от чужих денег или чтобы кто-то зависел от ваших? Что бы вы решали иначе, если бы ключи были у вас?",
      "step": "Если хотите, подумайте: какое одно небольшое решение про деньги вы можете принять сами, без чужого разрешения?",
      "verse": [
        "Два ключа, две ладони.",
        "Передать можно и обратно."
      ]
    },
    {
      "id": 21,
      "group": "roots",
      "title": "Белка и запасы",
      "kind": "animal",
      "motif": "eggs",
      "hue": 5,
      "people": false,
      "desc": "Маленькая рыжая белка сидит на мшистой ветке и держит в лапках один жёлудь; в дупле за ней спрятаны ещё несколько, сзади мягкий золотой свет.",
      "scene": "a small red squirrel sitting on a mossy branch holding one acorn in its paws, looking up calmly, a few more acorns tucked in a hollow behind it, soft golden backlight, pastel hazy forest",
      "q": "Сколько запасов вам нужно, чтобы выдохнуть? Что тревога говорит вам про «чёрный день»?",
      "step": "Если хотите, спросите себя: «Если запас уже есть, что я могу позволить себе сегодня?». Это не финансовый совет, а вопрос к себе.",
      "verse": [
        "Желудь в лапах, остальные в дупле.",
        "Можно доверять и тому, что уже есть."
      ]
    },
    {
      "id": 22,
      "group": "feelings",
      "title": "Зеркало в траве",
      "kind": "symbol",
      "motif": "spring",
      "hue": 1,
      "people": false,
      "desc": "Круглое ручное зеркало лежит в высокой луговой траве, в нём отражаются бледное золотое небо и одно облако; сквозь деревянную ручку проросший маленький голубой цветок.",
      "scene": "a round hand mirror lying in tall meadow grass reflecting a pale golden sky and a single cloud, a tiny blue flower growing through its wooden handle, soft pastel meadow light",
      "q": "С кем из окружающих вы сравниваете себя в деньгах? Чего не видно в их жизни и в вашей?",
      "step": "Если хотите, запишите одну вещь в вашей жизни, которую со стороны не заметить, но которая вам дорога.",
      "verse": [
        "В зеркале небо, а не чужой кошелёк.",
        "Цветок растёт там, где не ждали."
      ]
    },
    {
      "id": 23,
      "group": "feelings",
      "title": "Новое платье",
      "kind": "person",
      "motif": "windows",
      "hue": 2,
      "people": true,
      "desc": "Молодая женщина стоит у витрины, смотрит на светлое платье и тихо улыбается, чуть смущённо; в стекле отражается мягкий закат.",
      "scene": "a young woman stands by a shop window looking at a pale dress with a shy, quietly hopeful half-smile, her hand lightly touching the glass, soft golden sunset reflected in the window",
      "q": "Что происходит внутри, когда вы тратите деньги на себя? Чей голос вас одёргивает?",
      "step": "Если хотите, представьте, что подруга покупает себе то же самое. Что вы бы ей сказали? Скажите это себе.",
      "verse": [
        "Витрина не осуждает.",
        "Желание тоже вправе быть."
      ]
    },
    {
      "id": 24,
      "group": "feelings",
      "title": "Нераспечатанный конверт",
      "kind": "object",
      "motif": "blanket",
      "hue": 3,
      "people": false,
      "desc": "Белый конверт на подоконнике рядом с нетронутой чашкой чая; за окном мягкое утро и ветка с первыми листьями.",
      "scene": "a white sealed envelope on a windowsill beside an untouched cup of tea, a branch with first green leaves outside the window, soft morning light, pastel interior",
      "q": "Какое дело с деньгами вы обходите стороной? Что кажется самым страшным в первом шаге?",
      "step": "Если хотите, назначьте на этот конверт пять минут и таймер: открыть, посмотреть, закрыть. Больше ничего не нужно.",
      "verse": [
        "Конверт тихий.",
        "Тревога громче бумаги."
      ]
    },
    {
      "id": 25,
      "group": "next",
      "title": "Цена",
      "kind": "person",
      "motif": "wheel",
      "hue": 4,
      "people": true,
      "desc": "Мужчина средних лет за деревянным столом с открытой ладонью на столе; взгляд спокойный и прямой, с лёгкой уверенностью.",
      "scene": "a middle-aged man sits at a wooden table with an open palm resting on it, his gaze calm and direct with quiet confidence, soft golden window light, pastel interior",
      "q": "Какую цифру вам страшно произнести вслух? Что, как вам кажется, случится после?",
      "step": "Если хотите, скажите её вслух один раз, в одиночестве, спокойным голосом, и заметьте, что происходит в теле.",
      "verse": [
        "Цифра лежит на ладони.",
        "Её можно назвать спокойно."
      ]
    },
    {
      "id": 26,
      "group": "next",
      "title": "Нет и да",
      "kind": "pair",
      "motif": "fence",
      "hue": 5,
      "people": true,
      "desc": "Две подруги на скамье у ограды сада; одна мягко отводит руку в жесте «нет, спасибо», другая слушает с пониманием.",
      "scene": "two women friends sit on a garden bench by a low fence, one gently lifts her hand in a soft gesture of refusal while the other listens with understanding and a gentle smile, warm afternoon light, pastel garden",
      "q": "Что вы чувствуете, когда хочется сказать «нет», и чего боитесь потерять, если скажете?",
      "step": "Если хотите, потренируйтесь в одиночестве: «Сейчас я не могу, но желаю тебе удачи». Что чувствуется в теле?",
      "verse": [
        "«Нет» — тоже забота.",
        "Дружба выдерживает границу."
      ]
    },
    {
      "id": 27,
      "group": "next",
      "title": "Русло",
      "kind": "nature",
      "motif": "wave",
      "hue": 0,
      "people": false,
      "desc": "Широкий мелкий ручей на лугу огибает гладкий мшистый камень двумя тихими протоками; на воде золотой свет и несколько лепестков.",
      "scene": "a wide shallow stream in a meadow dividing around a smooth mossy stone into two quiet channels, golden light on the water, a few small petals floating along, soft pastel haze",
      "q": "Куда у вас течёт ваше внимание и деньги? Где вы пытаетесь перегородить, а где можно позволить течь?",
      "step": "Если хотите, найдите одно место, где вы держите всё «мёртвой хваткой», и представьте, что отпускаете хотя бы чуть-чуть.",
      "verse": [
        "Вода обходит камень.",
        "Не стоит с ним спорить."
      ]
    },
    {
      "id": 28,
      "group": "next",
      "title": "Якорь и лодка",
      "kind": "landscape",
      "motif": "sail",
      "hue": 1,
      "people": false,
      "desc": "Маленькая деревянная лодка на спокойной пастельной воде; трос уходит в прозрачную воду к якорю на песчаном дне; на горизонте золотой рассвет.",
      "scene": "a small wooden rowboat on a calm pastel bay with a rope going down into the clear water to an anchor resting on the sandy bottom, golden sunrise on the horizon, soft haze",
      "q": "Что в ваших деньгах держит вас в безопасности, а что не даёт плыть?",
      "step": "Если хотите, подумайте: что одно можно отпустить хотя бы на метр троса, чтобы лодка слегка покачалась, оставаясь в бухте?",
      "verse": [
        "Якорь держит.",
        "Бухта тоже часть моря."
      ]
    },
    {
      "id": 29,
      "group": "next",
      "title": "Лестница в облака",
      "kind": "sky",
      "motif": "stairs",
      "hue": 2,
      "people": false,
      "desc": "Тонкая деревянная лестница прислонена к мягкому розовому облаку в пастельном небе; на третьей ступеньке висит маленький золотой фонарик.",
      "scene": "a slender wooden ladder leaning against a soft pink cloud in a pastel sky, a small golden lantern hanging on the third rung, a flock of tiny birds passing far away, hazy light",
      "q": "На какой ступеньке вам сейчас уютно? Что вам подсказывает усталость от бесконечного подъёма?",
      "step": "Если хотите, остановитесь на «своей» ступеньке и назовите, что с неё видно хорошего.",
      "verse": [
        "Фонарь висит на третьей ступеньке.",
        "Высота измеряется не только вверх."
      ]
    },
    {
      "id": 30,
      "group": "next",
      "title": "Оттепель",
      "kind": "sky",
      "motif": "birds",
      "hue": 3,
      "people": false,
      "desc": "Широкая весенняя река с тонкими льдинами и низким золотым солнцем; на одной льдине маленький зелёный росток; небо розово-голубое и отражается в воде.",
      "scene": "a wide river in early spring with drifting thin ice floes, low golden sun over the water, one floe carrying a small green sprig, a pastel blue-pink sky mirrored in the water",
      "q": "Что в вашей денежной жизни начинает оттаивать? Чему ещё нужно время?",
      "step": "Если хотите, отметьте одну маленькую перемену к лучшему за последний год, даже если она едва заметна.",
      "verse": [
        "Лёд трогается.",
        "Росток едет на льдине."
      ]
    }
  ],
  "note": "Эта колода про чувства, связанные с деньгами. Это не финансовый и не психотерапевтический совет. Если у вас долги, угроза безопасности или очень тяжёлое состояние, обратитесь к специалисту.",
  "theme": {
    "accent": "#B87D5E",
    "accentDark": "#8C5A43",
    "soft": "#F1E3DA",
    "backTop": "#C99577",
    "backBottom": "#8C5A43",
    "bgTop": "#F7EFE6",
    "bgBottom": "#EBD9C7",
    "symbol": "coin"
  },
  "dailyQuestion": "Что мне важно заметить сегодня в отношениях с деньгами?"
});
