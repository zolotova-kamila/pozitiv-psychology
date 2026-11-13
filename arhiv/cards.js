// Колода «Тихий горизонт»: 24 карты о тревоге.
// ВАЖНО: ниже строгий JSON (двойные кавычки, без комментариев и запятых в конце): его читает и браузер,
// и скрипт tools/generate_cards.py. Так у колоды один источник правды.
// Готовые картинки лежат в cards/img/01.webp … 24.webp — они автоматически заменяют заглушки.
window.ARHIV_DECK = {
  "id": "base",
  "title": "Ассоциативная карта тревоги",
  "access": "free",
  "name": "Тихий горизонт",
  "imageDir": "cards/img/",
  "imageExt": "webp",
  "imageVersion": "20261113f",
  "basePrompt": "Soft hand-painted surrealist fine-art image with fine canvas grain, blending photographic realism with painterly texture, dreamlike and poetic. Pastel palette of dusty rose, mauve, lavender-grey, warm sand and cream, with a delicate golden glow as the single bright accent. Hazy atmospheric light, gentle diffused shadows. The image is built around one clear associative image (a detail of nature, an animal, a symbol, a surreal transformation, or a human gesture) that evokes feelings and associations and leaves room for the viewer's own interpretation. Dali-inspired dreamlike logic but an original composition. Quiet, hopeful mood. No text, no letters, no logos, no watermark. Vertical 2:3.",
  "noPeoplePrompt": "No people in the scene.",
  "negativePrompt": "skulls, bones, skeleton, blood, wounds, severed or disfigured body parts, gore, horror, monsters, spiders, snakes, grotesque or distorted faces, extra fingers, text, letters, logo, watermark, harsh black, heavy darkness, cartoon, 3d render",
  "groups": {
    "look": "Как выглядит тревога",
    "body": "Тело и дыхание",
    "block": "Что мешает",
    "help": "Что помогает"
  },
  "cards": [
    {
      "id": 1,
      "group": "look",
      "title": "Клубок",
      "motif": "thread",
      "hue": 0,
      "desc": "Женщина стоит на пустом плато и держит конец золотой нити. Огромный клубок катится рядом и разматывается вокруг одинокого дерева.",
      "scene": "a woman stands on an empty plateau gently holding the loose end of a golden thread that unwinds from an enormous ball of thread rolling beside her, the thread looping around a single lone tree",
      "q": "Какая мысль сейчас наматывается снова и снова?",
      "step": "Запишите эту мысль одной фразой и начните её со слов «Я замечаю, что думаю…».",
      "people": true,
      "kind": "person",
      "verse": [
        "Нить всё длиннее —",
        "и всё теплее ладонь,",
        "что её держит."
      ]
    },
    {
      "id": 2,
      "group": "look",
      "title": "Скачущие мысли",
      "motif": "birds",
      "hue": 4,
      "desc": "Огромное облако в форме скачущей лошади несётся над пустым полем. На холме стоит девочка и смотрит вверх: глаза широко раскрыты, ей и удивительно, и немного тревожно.",
      "scene": "a giant cloud shaped like a galloping horse crossing a pastel sky above an empty field, a small girl standing on a hill looking up with wide eyes of wonder mixed with unease",
      "q": "Какие мысли мчатся сейчас в вашей голове — и куда они, по-вашему, скачут?",
      "step": "Назовите вслух три мысли, которые мчатся. Затем скажите: «Это мысли. Они проходят, как облака».",
      "people": true,
      "kind": "sky",
      "verse": [
        "Облако-конь скачет и тает,",
        "а небо остаётся."
      ]
    },
    {
      "id": 3,
      "group": "look",
      "title": "Лестница в небо",
      "motif": "stairs",
      "hue": 1,
      "desc": "Молодой человек поднимается по ступеням из облаков. Лестница обрывается на середине, а на последней ступени стоит лампа.",
      "scene": "a young man seen from behind climbs a staircase of floating cloud steps that ends abruptly in mid-air, a small glowing golden lamp stands on the last step",
      "q": "Какой путь вы пытаетесь увидеть целиком, прежде чем сделать первый шаг?",
      "step": "Выберите только ближайшую ступеньку и сделайте её размером в 5 минут.",
      "people": true,
      "kind": "person",
      "verse": [
        "Конца у лестницы не видно.",
        "Ступенька под ногой — вот она."
      ]
    },
    {
      "id": 4,
      "group": "look",
      "title": "Хрупкое равновесие",
      "motif": "stone",
      "hue": 3,
      "desc": "Крупный план: розовый лепесток плывёт по тёмной спокойной воде. На его краю, сохраняя равновесие, стоит божья коровка. От лепестка расходятся круги.",
      "scene": "extreme close-up macro of a large pink flower petal floating on dark calm water, a ladybug standing at its edge keeping balance, concentric ripples around the petal",
      "q": "Что в вашей жизни сейчас держится на тонком равновесии — и что при этом всё же держит?",
      "step": "Положите руку на живот и сделайте три выдоха длиннее вдохов, как будто выравниваете лепесток.",
      "people": false,
      "kind": "nature",
      "verse": [
        "Лёгкий лепесток.",
        "Крошечное равновесие",
        "держит целый мир."
      ]
    },
    {
      "id": 5,
      "group": "look",
      "title": "Стол на краю",
      "motif": "table",
      "hue": 2,
      "desc": "Мужчина и женщина сидят друг напротив друга за накрытым столом на тонких ножках у обрыва. Они смотрят вниз, не друг на друга; на лицах тихая грусть. Между ними ровно горят две свечи.",
      "scene": "a man and a woman sit across from each other at a set dinner table standing on very thin stilt legs at the edge of a cliff, both looking down with quiet sadness and not at each other, shoulders slightly slumped, two candles burning steadily between them",
      "q": "О чём сейчас трудно говорить вслух — и с кем?",
      "step": "Напишите одну фразу, которую хотели бы сказать, но не сказали. Отправлять её необязательно.",
      "people": true,
      "kind": "pair",
      "verse": [
        "Свечи горят ровно.",
        "Между нами — целая пропасть",
        "и накрытый стол."
      ]
    },
    {
      "id": 6,
      "group": "look",
      "title": "Обратные часы",
      "motif": "hourglass",
      "hue": 5,
      "desc": "Огромные песочные часы стоят в поле. Песок поднимается вверх светящимися светлячками. В верхней колбе тихое звёздное небо, в нижней расцветает луг.",
      "scene": "a giant hourglass standing in a field whose sand rises upward as glowing fireflies, the upper bulb holding a tiny starry night sky and the lower bulb a blooming meadow",
      "q": "Куда вы торопите время, пытаясь всё успеть или подготовиться заранее?",
      "step": "Сделайте три медленных вдоха и проверьте: что из этого действительно срочно?",
      "people": false,
      "kind": "symbol",
      "verse": [
        "Песок взлетает светлячками —",
        "время умеет идти иначе."
      ]
    },
    {
      "id": 7,
      "group": "body",
      "title": "Узел",
      "motif": "knot",
      "hue": 0,
      "desc": "Молодой человек осторожно держит широкую золотую ленту, завязанную мягким узлом на ветке. Свободный конец ленты тянется к солнцу.",
      "scene": "a young man gently holds one end of a wide golden silk ribbon that is tied in a big soft knot around a tree branch, the other end of the ribbon floating up toward a warm sun",
      "q": "Где в теле сейчас больше всего напряжения?",
      "step": "Три раза: сильно напрягите это место на 5 секунд и медленно отпустите.",
      "people": true,
      "kind": "person",
      "verse": [
        "Узел на ветке,",
        "а лента всё тянется к солнцу —",
        "даже завязанная."
      ]
    },
    {
      "id": 8,
      "group": "body",
      "title": "Облако в ладонях",
      "motif": "shell",
      "hue": 4,
      "desc": "Снизу тянутся две ладони, сложенные лодочкой. Они бережно держат маленькое грозовое облако, сквозь его края пробивается золотой свет.",
      "scene": "two cupped open hands rising from the bottom of the frame, gently holding a small storm cloud, golden light seeping through its edges, soft lavender sky behind",
      "q": "Какая буря сейчас внутри вас — и как бы вы держали её, если бы она лежала в ладонях?",
      "step": "Положите ладони на грудь или живот. Подышите так, словно бережно держите это облако, и не пытайтесь его прогнать.",
      "people": true,
      "kind": "hands",
      "verse": [
        "Маленькая гроза в ладонях.",
        "Если держать бережно,",
        "она светится по краям."
      ]
    },
    {
      "id": 9,
      "group": "body",
      "title": "Улитка",
      "motif": "shell",
      "hue": 3,
      "desc": "Крупный план: улитка спряталась в раковину на зелёном листе. Спираль раковины раскрывается крошечной звёздной галактикой, на листе блестят капли росы.",
      "scene": "a snail withdrawn into its shell on a green leaf, the spiral of the shell opening into a tiny starry galaxy, dew drops glistening, macro view",
      "q": "От чего вы сейчас прячетесь в раковину — и что в ней для вас безопасно?",
      "step": "Подарите себе 5 минут «в раковине»: тишина, тепло, ничего не решать.",
      "people": false,
      "kind": "nature",
      "verse": [
        "Внутри раковины — звёзды.",
        "Не всякое укрытие — тьма."
      ]
    },
    {
      "id": 10,
      "group": "body",
      "title": "Парус",
      "motif": "sail",
      "hue": 3,
      "desc": "Большой парус без лодки стоит в поле высокой травы. Трава колышется вслед за ветром, как волны. Рядом неподвижно стоит цапля.",
      "scene": "a large sail without a boat standing in a quiet field of tall grass, the grass bending in waves with the wind, a heron standing nearby",
      "q": "Какое у вас сейчас дыхание: глубокое или короткое, в груди или в животе?",
      "step": "Пять раз: вдох на счёт 4, выдох на счёт 6.",
      "people": false,
      "kind": "nature",
      "verse": [
        "Парус без лодки",
        "дышит вместе с травой,",
        "и цапля не торопится."
      ]
    },
    {
      "id": 11,
      "group": "body",
      "title": "Пружина",
      "motif": "spring",
      "hue": 5,
      "desc": "Огромная пружина из лунного света сжата между двумя горами.",
      "scene": "a huge coiled spring made of soft moonlight compressed between two mountains under a lavender sky",
      "q": "Что в вас сейчас готово сорваться и не получает разрядки?",
      "step": "Подвигайтесь две минуты: потянитесь, пройдитесь, потрясите кистями.",
      "people": false,
      "kind": "symbol",
      "verse": [
        "Сжатая до предела,",
        "пружина из лунного света",
        "помнит, что она — свет."
      ]
    },
    {
      "id": 12,
      "group": "body",
      "title": "Улей",
      "motif": "hive",
      "hue": 0,
      "desc": "Стеклянный улей светится изнутри. Крошечные светящиеся пчёлы кружат вокруг.",
      "scene": "a glass beehive glowing with warm golden light, tiny luminous bees swirling inside and around it",
      "q": "Какой «гул» вы слышите в голове — и о чём он?",
      "step": "Выберите самый тихий звук вокруг и слушайте его целую минуту. Гул постепенно станет фоном.",
      "people": false,
      "kind": "symbol",
      "verse": [
        "В стеклянном улье гудит свет.",
        "Пчёлам не страшно быть громкими."
      ]
    },
    {
      "id": 13,
      "group": "block",
      "title": "Дверь в поле",
      "motif": "door",
      "hue": 1,
      "desc": "Девочка тянется к ручке двери, стоящей посреди луга без стен. Женщина за её спиной бережно положила ей руку на плечо. Из-под двери пробивается золотой свет.",
      "scene": "a girl about eight reaches toward the handle of a lone wooden door standing in a meadow with no walls, while a woman behind her gently rests a hand on her shoulder, the same meadow visible behind the door, a thin line of golden light under it",
      "q": "Чего вы сейчас избегаете — и что вы при этом теряете?",
      "step": "Выберите самую маленькую версию избегаемого (одно сообщение, один звонок) и назначьте время.",
      "people": true,
      "kind": "pair",
      "verse": [
        "Дверь без стен.",
        "За ней — тот же луг,",
        "но свет под дверью другой."
      ]
    },
    {
      "id": 14,
      "group": "block",
      "title": "Птенец",
      "motif": "eggs",
      "hue": 4,
      "desc": "Ровные ряды одинаковых белых яиц. Одно из них треснуло, и из него с любопытством выглядывает золотой птенец, глядя в небо.",
      "scene": "rows of identical white eggs on a pale field, one egg cracked open with a tiny golden chick peeking out and looking at the sky with curiosity",
      "q": "Что вы откладываете, пока не получится «достаточно хорошо»?",
      "step": "Сделайте это «на троечку» за 10 минут. Цель — сделано, а не идеально.",
      "people": false,
      "kind": "animal",
      "verse": [
        "Среди одинаковых яиц",
        "один выглянул —",
        "и небо оказалось больше."
      ]
    },
    {
      "id": 15,
      "group": "block",
      "title": "Подсолнух на привязи",
      "motif": "knot",
      "hue": 2,
      "desc": "Высокий подсолнух туго привязан к прямому колышку. Он всё равно тянется к солнцу. На стебле сидит улитка.",
      "scene": "a lone tall sunflower tied tightly to a straight wooden stake with a string, still leaning toward the sun, a small snail on its stem, soft pastel field",
      "q": "Что вы пытаетесь удержать по струнке — и куда оно само хочет тянуться?",
      "step": "Разделите лист на два столбца: «зависит от меня» и «не зависит». Распределите всё по ним.",
      "people": false,
      "kind": "nature",
      "verse": [
        "Подсолнух на привязи",
        "всё равно знает,",
        "где солнце."
      ]
    },
    {
      "id": 16,
      "group": "block",
      "title": "Погода внутри",
      "motif": "windows",
      "hue": 1,
      "desc": "Пейзаж разделён пополам: слева солнечный луг, справа тихий дождь. На границе стоит дом, и в его окнах разная погода. На подоконнике сидит кот.",
      "scene": "a surreal landscape split vertically in half: sunny meadow on the left, gentle rain on the right, a small house standing on the border with different weather visible in its windows, a cat sitting on a windowsill",
      "q": "Какой вариант будущего вы прокручиваете чаще всего — и какая «погода» в нём?",
      "step": "Придумайте и запишите ещё один вариант — нейтральный или добрый.",
      "people": false,
      "kind": "landscape",
      "verse": [
        "Слева солнце, справа дождь.",
        "Дом стоит посередине",
        "и светится."
      ]
    },
    {
      "id": 17,
      "group": "block",
      "title": "Чемодан",
      "motif": "suitcase",
      "hue": 3,
      "desc": "Старый чемодан стоит на пустом перроне. Из него выросло маленькое дерево, в ветвях свито гнездо, а на ручке сидит птица.",
      "scene": "an old suitcase on an empty train platform with a small tree growing out of it, a bird's nest in its branches, a bird sitting on the suitcase handle",
      "q": "Что вы продолжаете нести с собой, хотя поезд давно ушёл?",
      "step": "Напишите, что из этого действительно ваше, а что можно оставить на перроне.",
      "people": false,
      "kind": "object",
      "verse": [
        "Прошлое в чемодане",
        "тоже может пустить корни",
        "и свить гнездо."
      ]
    },
    {
      "id": 18,
      "group": "block",
      "title": "Рупор",
      "motif": "horn",
      "hue": 5,
      "desc": "На горном хребте стоит старый рупор. От него по долине расходятся светящиеся круги.",
      "scene": "an old megaphone horn on a mountain ridge sending glowing golden concentric rings across a misty valley",
      "q": "Чей голос звучит в вашей тревожной мысли: ваш, родителей, учителя?",
      "step": "Перескажите эту мысль так, как сказал бы вам добрый друг.",
      "people": false,
      "kind": "object",
      "verse": [
        "Голос уходит кругами",
        "и возвращается тише."
      ]
    },
    {
      "id": 19,
      "group": "help",
      "title": "Островок",
      "motif": "island",
      "hue": 1,
      "desc": "Огромный спящий кит в спокойном море. На его спине вырос островок с деревом и фонарём. Под деревом крошечная фигурка спокойно отдыхает.",
      "scene": "a huge sleeping whale in a calm pastel sea, its back an island with a tree and a street lamp, a tiny person resting peacefully under the tree",
      "q": "Что в вашей жизни огромное и спокойное, на чьей спине можно отдохнуть?",
      "step": "Проведите 5 минут с тем, что даёт вам опору: человеком, местом, делом.",
      "people": true,
      "kind": "animal",
      "verse": [
        "Кит спит.",
        "На его спине — дерево,",
        "фонарь и тишина."
      ]
    },
    {
      "id": 20,
      "group": "help",
      "title": "Чашка-река",
      "motif": "teapot",
      "hue": 2,
      "desc": "Из большой чашки чая течёт тихая река и уходит в пейзаж. По ней плывёт крошечная лодка с золотым огоньком, а пар над чашкой превращается в облака.",
      "scene": "a large teacup on a stone table from which a calm river flows out into a quiet landscape, a tiny boat with a golden lantern floating on it, steam rising from the cup and forming soft clouds",
      "q": "Что сделало бы паузу возможной именно сегодня?",
      "step": "Пять минут без экрана и задач. Поставьте таймер.",
      "people": false,
      "kind": "symbol",
      "verse": [
        "Чашка чая —",
        "целая река,",
        "по которой плывёт огонёк."
      ]
    },
    {
      "id": 21,
      "group": "help",
      "title": "Мост из света",
      "motif": "bridge",
      "hue": 4,
      "desc": "Мужчина протягивает руку женщине в начале моста из света над туманной пропастью. У него спокойная ободряющая улыбка, она смотрит с надеждой и сомнением.",
      "scene": "a man stands at the beginning of a bridge made of golden light that spans a misty chasm, holding out his hand to a woman beside him, he with a reassuring gentle smile, she with hopeful but hesitant eyes, about to step onto the bridge",
      "q": "Какой самый маленький шаг вы готовы сделать — и кто мог бы протянуть вам руку?",
      "step": "Сделайте этот шаг сегодня или напишите тому, кто мог бы вас поддержать.",
      "people": true,
      "kind": "pair",
      "verse": [
        "Мост из света",
        "начинается с протянутой руки."
      ]
    },
    {
      "id": 22,
      "group": "help",
      "title": "Дом на ладони",
      "motif": "island",
      "hue": 0,
      "desc": "Из мягких облаков тянется большая открытая ладонь. На ней крошечный дом с одним тёплым окошком, на крыше сидит птичка.",
      "scene": "a large open hand reaching down from soft pastel clouds, on its palm a tiny house with one warm glowing window and a small bird sitting on the roof",
      "q": "Что для вас сейчас «дом» — то, где можно быть собой?",
      "step": "Сделайте для себя одну заботливую мелочь: тепло, вода, еда, мягкий свет.",
      "people": true,
      "kind": "hands",
      "verse": [
        "Дом — это не стены.",
        "Дом — тёплое окно",
        "на чьей-то ладони."
      ]
    },
    {
      "id": 23,
      "group": "help",
      "title": "Калитка",
      "motif": "fence",
      "hue": 3,
      "desc": "Мужчина стоит у открытой калитки низкой изгороди и открыто, спокойно улыбается. За ним цветущий сад. Женщина снаружи остановилась и закусила губу в раздумье.",
      "scene": "a man stands inside a low garden fence at its open gate with a calm welcoming expression while a woman outside the fence hesitates, biting her lip, a blooming garden behind him in an otherwise empty landscape",
      "q": "Где вам нужно сказать «нет» или «не сейчас» — и где «да»?",
      "step": "Сформулируйте одну границу одной фразой. Необязательно произносить её вслух сегодня.",
      "people": true,
      "kind": "pair",
      "verse": [
        "Калитка открыта.",
        "Входить необязательно,",
        "но она открыта."
      ]
    },
    {
      "id": 24,
      "group": "help",
      "title": "Волна",
      "motif": "wave",
      "hue": 5,
      "desc": "Девочка стоит на берегу и смотрит на стеклянную волну, застывшую аркой над морем. Глаза широко раскрыты от удивления. Под аркой проплывает лодка из света.",
      "scene": "a girl stands on the shore looking up at a glass-like wave frozen mid-air in an arch, eyes wide with awe, lips slightly parted, a small boat of golden light passing beneath it",
      "q": "Что, если эта тревога — волна, которая поднимется и пройдёт?",
      "step": "Полторы минуты наблюдайте за ощущением, не споря с ним. Отмечайте, как оно меняется.",
      "people": true,
      "kind": "person",
      "verse": [
        "Волна замерла аркой,",
        "и под ней плывёт",
        "лодка света."
      ]
    }
  ],
  "peoplePrompt": "People or hands in the image are of varied ages, all with Slavic / Eastern European appearance and fair skin. Faces, poses and body language are expressive and true to the emotion of the scene (wonder, hesitation, quiet sadness, tenderness, tiredness, relief), always gentle and never grotesque or in anguish; anatomically correct hands and fingers; softly lit faces.",
  "kindLabels": {
    "person": "Человек",
    "pair": "Двое",
    "hands": "Ладони и жесты",
    "sky": "Небо и облака",
    "nature": "Деталь природы",
    "animal": "Животное",
    "landscape": "Сюрреалистичный пейзаж",
    "symbol": "Символ",
    "object": "Предмет"
  }
}
