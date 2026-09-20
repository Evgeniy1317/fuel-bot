import type { CountryCode, Locale } from "../types";

export interface City {
  slug: string;
  country: CountryCode;
  nameRu: string;
  nameRo: string;
  aliases: string[];
}

function city(
  slug: string,
  country: CountryCode,
  nameRu: string,
  nameRo: string,
  extraAliases: string[] = [],
): City {
  return {
    slug,
    country,
    nameRu,
    nameRo,
    aliases: extraAliases,
  };
}

/** Города ПМР (кнопки) и города Молдовы: ввод на русском или румынском. */
export const CITIES: City[] = [
  city("tiraspol", "PMR", "Тирасполь", "Tiraspol"),
  city("bender", "PMR", "Бендеры", "Bender", ["тигина", "tighina", "benderi"]),
  city("rybnitsa", "PMR", "Рыбница", "Rîbnița", ["ribnita", "rybnytsia"]),
  city("dubasari", "PMR", "Дубоссары", "Dubăsari", ["dubossary"]),
  city("slobozia", "PMR", "Слободзея", "Slobozia"),
  city("grigoriopol", "PMR", "Григориополь", "Grigoriopol"),
  city("camenca", "PMR", "Каменка", "Camenca", ["kamenka"]),
  city("dnestrovsc", "PMR", "Днестровск", "Dnestrovsc", ["dnestrovsk"]),

  city("chisinau", "MD", "Кишинёв", "Chișinău", ["кишинев", "кишинэу", "kishinev", "chisinau"]),
  city("balti", "MD", "Бельцы", "Bălți", ["белцы", "балти", "balti", "beltsy"]),
  city("cahul", "MD", "Кагул", "Cahul"),
  city("ungheni", "MD", "Унгены", "Ungheni"),
  city("orhei", "MD", "Оргеев", "Orhei", ["орхей"]),
  city("soroca", "MD", "Сороки", "Soroca"),
  city("comrat", "MD", "Комрат", "Comrat"),
  city("causeni", "MD", "Каушаны", "Căușeni", ["каушень"]),
  city("hincesti", "MD", "Хынчешты", "Hîncești", ["хинчешты", "hancesti"]),
  city("edinet", "MD", "Единцы", "Edineț"),
  city("drochia", "MD", "Дрокия", "Drochia"),
  city("straseni", "MD", "Страшены", "Strășeni"),
  city("calarasi", "MD", "Калараш", "Călărași"),
  city("taraclia", "MD", "Тараклия", "Taraclia"),
  city("ceadir-lunga", "MD", "Чадыр-Лунга", "Ceadîr-Lunga", [
    "чадыр лунга",
    "ceadar-lunga",
    "ceadir lunga",
    "chadyr-lunga",
  ]),
  city("vulcanesti", "MD", "Вулканешты", "Vulcănești"),
  city("ocnita", "MD", "Окница", "Ocnița"),
  city("rezina", "MD", "Резина", "Rezina"),
  city("stefan-voda", "MD", "Штефан-Водэ", "Ștefan Vodă", ["штефан водэ", "stefan voda"]),
  city("anenii-noi", "MD", "Новые Анены", "Anenii Noi", ["анений ной", "анены", "anenii"]),
  city("ialoveni", "MD", "Яловены", "Ialoveni"),
  city("nisporeni", "MD", "Ниспорены", "Nisporeni"),
  city("falesti", "MD", "Фалешты", "Fălești"),
  city("floresti", "MD", "Флорешты", "Florești"),
  city("glodeni", "MD", "Глодяны", "Glodeni"),
  city("riscani", "MD", "Рышканы", "Rîșcani", ["рышкань", "rascani"]),
  city("singerei", "MD", "Сынжерей", "Sîngerei", ["сынджерей", "sangerei"]),
  city("telenesti", "MD", "Теленешты", "Telenești"),
  city("criuleni", "MD", "Криуляны", "Criuleni"),
  city("donduseni", "MD", "Дондюшаны", "Dondușeni"),
  city("briceni", "MD", "Бричаны", "Briceni"),
  city("basarabeasca", "MD", "Бессарабка", "Basarabeasca"),
  city("leova", "MD", "Леова", "Leova"),
  city("cantemir", "MD", "Кантемир", "Cantemir"),
  city("cimislia", "MD", "Чимишлия", "Cimișlia"),
  city("soldanesti", "MD", "Шолданешты", "Șoldănești"),
  city("durlesti", "MD", "Дурлешты", "Durlești"),
  city("codru", "MD", "Кодру", "Codru"),
  city("cricova", "MD", "Криково", "Cricova"),
  city("singera", "MD", "Сынжера", "Sîngera", ["сынджера", "sangera"]),
  city("vadul-lui-voda", "MD", "Вадул-луй-Водэ", "Vadul lui Vodă", [
    "вадул луй водэ",
    "vadul lui voda",
  ]),
  city("vatra", "MD", "Ватра", "Vatra"),
  city("stauceni", "MD", "Ставчены", "Stăuceni", ["стаучены"]),
  city("cupcini", "MD", "Купчинь", "Cupcini", ["капрешты", "kupchino"]),
  city("costesti", "MD", "Костешты", "Costești"),
  city("lipcani", "MD", "Липканы", "Lipcani"),
  city("otaci", "MD", "Атаки", "Otaci", ["отачь"]),
  city("frunza", "MD", "Фрунзе", "Frunză"),
  city("ghindesti", "MD", "Гиндешты", "Ghindești"),
  city("marculesti", "MD", "Маркулешты", "Mărculești"),
  city("biruinta", "MD", "Бируинца", "Biruința"),
  city("bucovat", "MD", "Буковец", "Bucovăț", ["буковэц"]),
  city("cainari", "MD", "Каинары", "Căinari", ["кайнары"]),
  city("cornesti", "MD", "Корнешты", "Cornești"),
  city("iargara", "MD", "Яргара", "Iargara"),
  city("tvardita", "MD", "Твардица", "Tvardița"),
];

export function normalizeCityQuery(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[ăâ]/g, "a")
    .replace(/î/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
    .replace(/^(г\.?|гор\.?|город|or\.?|orasul|oras|mun\.?|municipiul)\s+/i, "")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function cityNeedles(entry: City): string[] {
  return [entry.slug.replace(/-/g, " "), entry.nameRu, entry.nameRo, ...entry.aliases].map(
    normalizeCityQuery,
  );
}

export function citiesIn(country: CountryCode): City[] {
  return CITIES.filter((entry) => entry.country === country);
}

function translitCyr(value: string): string {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ж: "j",
    з: "z",
    и: "i",
    й: "i",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "c",
    ч: "c",
    ш: "s",
    щ: "s",
    ъ: "",
    ы: "i",
    ь: "",
    э: "e",
    ю: "iu",
    я: "ia",
  };
  return [...value].map((ch) => map[ch] ?? ch).join("");
}

export function namesMatch(a: string, b: string): boolean {
  const left = normalizeCityQuery(a);
  const right = normalizeCityQuery(b);
  if (!left || !right) {
    return false;
  }
  if (left === right) {
    return true;
  }
  const tl = translitCyr(left);
  const tr = translitCyr(right);
  if (tl === tr) {
    return true;
  }
  if (left.length >= 4 && (left.includes(right) || right.includes(left))) {
    return true;
  }
  if (tl.length >= 5 && (tl.startsWith(tr.slice(0, 5)) || tr.startsWith(tl.slice(0, 5)))) {
    return true;
  }
  return false;
}

export function findCity(query: string, country: CountryCode): City | null {
  const needle = normalizeCityQuery(query);
  if (needle.length < 2) {
    return null;
  }

  const pool = citiesIn(country);
  const exact = pool.find((entry) => cityNeedles(entry).includes(needle));
  if (exact) {
    return exact;
  }

  const folded = translitCyr(needle);
  const translitHits = pool.filter((entry) =>
    cityNeedles(entry).some((alias) => translitCyr(alias) === folded),
  );
  if (translitHits.length === 1) {
    return translitHits[0]!;
  }

  if (needle.length >= 5) {
    const prefixHits = pool.filter((entry) =>
      cityNeedles(entry).some((alias) => {
        const ta = translitCyr(alias);
        return alias.startsWith(needle) || ta.startsWith(folded);
      }),
    );
    if (prefixHits.length === 1) {
      return prefixHits[0]!;
    }
  }

  return null;
}

/** Принимаем только город из каталога — и для ПМР, и для Молдовы. */
export function resolveCityInput(query: string, country: CountryCode): City | null {
  return findCity(query, country);
}

export function cityLabel(slug: string, locale: Locale): string {
  const entry = CITIES.find((item) => item.slug === slug);
  if (!entry) {
    return slug.replace(/-/g, " ");
  }
  return locale === "ro" ? entry.nameRo : entry.nameRu;
}

export function cityExamples(country: CountryCode, locale: Locale): string {
  const sample =
    country === "PMR"
      ? CITIES.filter((entry) =>
          ["tiraspol", "bender", "rybnitsa", "slobozia"].includes(entry.slug),
        )
      : CITIES.filter((entry) =>
          ["chisinau", "balti", "cahul", "comrat"].includes(entry.slug),
        );
  return sample
    .map((entry) => (locale === "ro" ? entry.nameRo : entry.nameRu))
    .join(", ");
}
