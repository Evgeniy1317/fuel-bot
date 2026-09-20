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

/** Крупные города ПМР и Молдовы: ответ на русском или румынском. */
export const CITIES: City[] = [
  city("tiraspol", "PMR", "Тирасполь", "Tiraspol"),
  city("bender", "PMR", "Бендеры", "Bender", ["тигина", "tighina", "benderi"]),
  city("rybnitsa", "PMR", "Рыбница", "Rîbnița", ["ribnita", "rybnytsia"]),
  city("dubasari", "PMR", "Дубоссары", "Dubăsari", ["dubossary"]),
  city("slobozia", "PMR", "Слободзея", "Slobozia"),
  city("grigoriopol", "PMR", "Григориополь", "Grigoriopol"),
  city("camenca", "PMR", "Каменка", "Camenca", ["kamenka"]),
  city("dnestrovsc", "PMR", "Днестровск", "Dnestrovsc", ["dnestrovsk"]),

  city("chisinau", "MD", "Кишинёв", "Chișinău", ["кишинев", "kishinev", "chisinau"]),
  city("balti", "MD", "Бельцы", "Bălți", ["balti", "beltsy"]),
  city("cahul", "MD", "Кагул", "Cahul"),
  city("ungheni", "MD", "Унгены", "Ungheni"),
  city("orhei", "MD", "Оргеев", "Orhei"),
  city("soroca", "MD", "Сороки", "Soroca"),
  city("comrat", "MD", "Комрат", "Comrat"),
  city("causeni", "MD", "Каушаны", "Căușeni"),
  city("hincesti", "MD", "Хынчешты", "Hîncești"),
  city("edinet", "MD", "Единцы", "Edineț"),
  city("drochia", "MD", "Дрокия", "Drochia"),
  city("straseni", "MD", "Страшены", "Strășeni"),
  city("calarasi", "MD", "Калараш", "Călărași"),
  city("taraclia", "MD", "Тараклия", "Taraclia"),
  city("ceadir-lunga", "MD", "Чадыр-Лунга", "Ceadîr-Lunga", ["chadyr-lunga"]),
  city("vulcanesti", "MD", "Вулканешты", "Vulcănești"),
  city("ocnita", "MD", "Окница", "Ocnița"),
  city("rezina", "MD", "Резина", "Rezina"),
  city("stefan-voda", "MD", "Штефан-Водэ", "Ștefan Vodă"),
  city("anenii-noi", "MD", "Новые Анены", "Anenii Noi"),
  city("ialoveni", "MD", "Яловены", "Ialoveni"),
  city("nisporeni", "MD", "Ниспорены", "Nisporeni"),
  city("falesti", "MD", "Фалешты", "Fălești"),
  city("floresti", "MD", "Флорешты", "Florești"),
  city("glodeni", "MD", "Глодяны", "Glodeni"),
  city("riscani", "MD", "Рышканы", "Rîșcani"),
  city("singerei", "MD", "Сынжерей", "Sîngerei"),
  city("telenesti", "MD", "Теленешты", "Telenești"),
  city("criuleni", "MD", "Криуляны", "Criuleni"),
  city("donduseni", "MD", "Дондюшаны", "Dondușeni"),
  city("briceni", "MD", "Бричаны", "Briceni"),
  city("basarabeasca", "MD", "Бессарабка", "Basarabeasca"),
  city("leova", "MD", "Леова", "Leova"),
  city("cantemir", "MD", "Кантемир", "Cantemir"),
  city("cimislia", "MD", "Чимишлия", "Cimișlia"),
  city("soldanesti", "MD", "Шолданешты", "Șoldănești"),
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
  return [entry.slug, entry.nameRu, entry.nameRo, ...entry.aliases].map(normalizeCityQuery);
}

export function findCity(query: string, country: CountryCode): City | null {
  const needle = normalizeCityQuery(query);
  if (needle.length < 3) {
    return null;
  }

  const pool = CITIES.filter((entry) => entry.country === country);
  const exact = pool.find((entry) => cityNeedles(entry).includes(needle));
  if (exact) {
    return exact;
  }

  const partial = pool.filter((entry) =>
    cityNeedles(entry).some(
      (alias) => alias.startsWith(needle) || (needle.length >= 5 && alias.includes(needle)),
    ),
  );
  return partial.length === 1 ? partial[0]! : null;
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

export function cityLabel(slug: string, locale: Locale): string {
  const entry = CITIES.find((item) => item.slug === slug);
  if (!entry) {
    return slug;
  }
  return locale === "ro" ? entry.nameRo : entry.nameRu;
}
