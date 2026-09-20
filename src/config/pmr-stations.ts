export interface PmrStation {
  citySlug: string;
  nameRu: string;
  nameRo: string;
  lat: number;
  lng: number;
}

/** Крупные АЗС Sheriff в городах ПМР — координаты для карты. Цены сети единые. */
export const PMR_STATIONS: PmrStation[] = [
  { citySlug: "tiraspol", nameRu: "Sheriff, ул. 25 Октября", nameRo: "Sheriff, str. 25 Octombrie", lat: 46.8404, lng: 29.6436 },
  { citySlug: "tiraspol", nameRu: "Sheriff, ул. Мира", nameRo: "Sheriff, str. Mira", lat: 46.8498, lng: 29.6272 },
  { citySlug: "tiraspol", nameRu: "Sheriff, Южный", nameRo: "Sheriff, Sud", lat: 46.8225, lng: 29.6331 },
  { citySlug: "tiraspol", nameRu: "Sheriff, Юности", nameRo: "Sheriff, Yunosti", lat: 46.8372, lng: 29.5984 },
  { citySlug: "bender", nameRu: "Sheriff, центр", nameRo: "Sheriff, centru", lat: 46.8364, lng: 29.4729 },
  { citySlug: "bender", nameRu: "Sheriff, юг", nameRo: "Sheriff, sud", lat: 46.8201, lng: 29.4848 },
  { citySlug: "rybnitsa", nameRu: "Sheriff, центр", nameRo: "Sheriff, centru", lat: 47.7654, lng: 29.0008 },
  { citySlug: "rybnitsa", nameRu: "Sheriff, Кирова", nameRo: "Sheriff, Kirov", lat: 47.7718, lng: 29.0146 },
  { citySlug: "dubasari", nameRu: "Sheriff, Дубоссары", nameRo: "Sheriff, Dubăsari", lat: 47.2658, lng: 29.1604 },
  { citySlug: "slobozia", nameRu: "Sheriff, Слободзея", nameRo: "Sheriff, Slobozia", lat: 46.7292, lng: 29.7086 },
  { citySlug: "grigoriopol", nameRu: "Sheriff, Григориополь", nameRo: "Sheriff, Grigoriopol", lat: 47.1539, lng: 29.2934 },
  { citySlug: "camenca", nameRu: "Sheriff, Каменка", nameRo: "Sheriff, Camenca", lat: 48.0327, lng: 28.7091 },
  { citySlug: "dnestrovsc", nameRu: "Sheriff, Днестровск", nameRo: "Sheriff, Dnestrovsc", lat: 46.6218, lng: 29.9207 },
];

export function pmrStationsIn(citySlug: string): PmrStation[] {
  return PMR_STATIONS.filter((station) => station.citySlug === citySlug);
}

export function mapsUrl(lat: number, lng: number) {
  return `https://maps.google.com/?q=${lat},${lng}`;
}
