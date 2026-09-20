export interface PmrStation {
  citySlug: string;
  nameRu: string;
  nameRo: string;
  addressRu: string;
  addressRo: string;
  mapQuery: string;
}

function station(
  citySlug: string,
  nameRu: string,
  nameRo: string,
  addressRu: string,
  addressRo: string,
): PmrStation {
  return {
    citySlug,
    nameRu,
    nameRo,
    addressRu,
    addressRo,
    mapQuery: `${nameRu}, ${addressRu}`,
  };
}

/**
 * Только АЗС Sheriff с официальными розничными ценами на сегодня:
 * https://sheriff.md/activities/nefteprodukty/ceny_po_regionam
 */
export const PMR_STATIONS: PmrStation[] = [
  station("tiraspol", "Sheriff АЗК-1", "Sheriff AZK-1", "г. Тирасполь, ул. Шевченко", "Tiraspol, str. Șevchenko"),
  station("tiraspol", "Sheriff АЗК-2", "Sheriff AZK-2", "г. Тирасполь, ул. К. Либкнехта, 1/1", "Tiraspol, str. K. Liebknecht, 1/1"),
  station("tiraspol", "Sheriff АЗС-4", "Sheriff AZS-4", "г. Тирасполь, ул. Одесская (выезд на Одессу)", "Tiraspol, str. Odesa (ieșire spre Odesa)"),
  station("tiraspol", "Sheriff АЗС-5", "Sheriff AZS-5", "г. Тирасполь, ул. Мира, 50 (НИИ)", "Tiraspol, str. Mira, 50"),
  station("tiraspol", "Sheriff АЗС-7", "Sheriff AZS-7", "г. Тирасполь, ул. Синева (автостанция)", "Tiraspol, str. Sinev (autogară)"),
  station("tiraspol", "Sheriff АЗС-15", "Sheriff AZS-15", "г. Тирасполь, ул. Сакриера, 66/1", "Tiraspol, str. Sacriera, 66/1"),

  station("bender", "Sheriff АЗС-10", "Sheriff AZS-10", "г. Бендеры, ул. Тираспольская, 1а (центр, у автовокзала)", "Bender, str. Tiraspol, 1a (centru, autogară)"),

  station("rybnitsa", "Sheriff АЗК-9", "Sheriff AZK-9", "г. Рыбница, ул. Вальченко, 2 / ул. Горького, 2-а", "Rîbnița, str. Valchenko, 2 / str. Gorki, 2a"),
  station("rybnitsa", "Sheriff АЗК-14", "Sheriff AZK-14", "г. Рыбница, ул. Кирова, 159-а / 148-а", "Rîbnița, str. Kirov, 159a / 148a"),

  station("dubasari", "Sheriff АЗС-3", "Sheriff AZS-3", "г. Дубоссары, с. Лунга, ул. Свердлова, 200 (круг)", "Dubăsari, Lunga, str. Sverdlov, 200"),
  station("dubasari", "Sheriff АЗС-6", "Sheriff AZS-6", "г. Дубоссары, ул. Горького, 41 (центр)", "Dubăsari, str. Gorki, 41 (centru)"),

  station("grigoriopol", "Sheriff АЗС-11", "Sheriff AZS-11", "г. Григориополь, ул. Ленина, 4а", "Grigoriopol, str. Lenin, 4a"),
  station("grigoriopol", "Sheriff АЗС-17", "Sheriff AZS-17", "с. Красная Горка, ул. Тираспольская, 75", "Krasnaia Gorka, str. Tiraspol, 75"),

  station("slobozia", "Sheriff АЗС-8", "Sheriff AZS-8", "г. Слободзея, ул. Ленина, 74/1 (центр)", "Slobozia, str. Lenin, 74/1 (centru)"),
  station("slobozia", "Sheriff АЗС-12", "Sheriff AZS-12", "п. Незавертайловка, ул. Жукова, 1а", "Nezavertailovca, str. Jukov, 1a"),
  station("slobozia", "Sheriff АЗС-16", "Sheriff AZS-16", "пгт. Первомайск, ул. Садовая, 1в", "Pervomaisc, str. Sadovaia, 1v"),
  station("slobozia", "Sheriff АЗС Глиное", "Sheriff AZS Hlinaia", "с. Глиное, ул. Котовского, 2", "Hlinaia, str. Kotovski, 2"),
];

export function pmrStationsIn(citySlug: string): PmrStation[] {
  return PMR_STATIONS.filter((entry) => entry.citySlug === citySlug);
}

/** В ПМР у Google часто нет точки АЗС — ищем по адресу в Яндекс.Картах. */
export function pmrMapsUrl(query: string) {
  return `https://yandex.ru/maps/?mode=search&text=${encodeURIComponent(query)}`;
}

export function mdMapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
