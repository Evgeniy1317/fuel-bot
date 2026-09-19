import type { Messages } from "./ru";

export const ro: Messages = {
  start: {
    welcome:
      "Salut! Sunt botul «Alimentează-te inteligent» — te ajut să economisești la combustibil în Transnistria și Moldova.\n\nCâteva întrebări scurte, iar apoi totul merge singur: alerte de preț, buget și sfaturi pentru mașina ta.",
    language: "Выбери язык / Alege limba",
  },
  onboarding: {
    country: "De unde te alimentezi?",
    countryPmr: "Transnistria",
    countryMd: "Moldova",
    car: "Marca și modelul mașinii într-un mesaj.\nDe exemplu: Volkswagen Golf",
    propulsion: "Cu ce alimentezi mașina?",
    gasoline: "Benzină",
    lpg: "GPL",
    fillGrade: "Ce benzină pui de obicei?",
    consumption:
      "Consum mediu, l/100 km. Un număr, de exemplu: 8.5",
    dailyKm: "Câți kilometri faci aproximativ pe zi? De exemplu: 40",
    watchFuels:
      "Pentru ce tipuri de combustibil vrei alerte? Poți alege mai multe. Când termini — apasă «Gata».",
    watchDone: "Gata",
    done: "Gata! Calculez economia pentru mașina și traseul tău. Alertele vin singure, când apar știri despre preț.",
    skipLong: "Ultimul pas — mai puțin de un minut.",
  },
  menu: {
    title: "Meniu principal",
    savings: "Economia mea",
    budget: "Buget lunar",
    subscribe: "Abonament",
    leaderboard: "Clasament",
    settings: "Setări",
    language: "Limbă",
  },
  subscription: {
    trial: "Ai o săptămână gratuită. Apoi — abonament în Stars.",
    pay: "Activează abonamentul",
    active: "Abonamentul este activ până la {date}.",
    complimentary:
      "Luna aceasta accesul este deschis. Alimentează-te liniștit — suntem pe fază cu prețurile.",
    expired:
      "Perioada de probă s-a încheiat. Pentru alerte și calculul economiei, activează abonamentul.",
    invoiceDescription: "Alerte personale și calculul economiei pentru o lună",
  },
  alert: {
    hike: "Pentru {fuel} în {region} reperul este {amount} {currency}. Merită să alimentezi în orele următoare.",
    up: "{fuel}: {amount} {currency} ({region}).",
    down: "{fuel} a scăzut la {amount} {currency} ({region}).",
  },
  guarantee: {
    complimentaryGranted:
      "Luna aceasta abonamentul e din partea noastră. Folosește alertele ca de obicei — alimentează-te mai liniștit.",
  },
  leaderboard: {
    title: "Cine a economisit cel mai mult",
    empty: "Încă e devreme pentru clasament — apar primele calcule.",
    line: "{place}. {name} — {amount} {currency}",
  },
  savings: {
    empty: "Când vor fi prețuri și profilul tău, îți arăt economia.",
    summary:
      "Pe perioadă: circa {amount} {currency} (aproximativ {liters} l pentru mașina ta).",
  },
  errors: {
    number: "Trebuie un număr, încearcă din nou.",
    generic: "Ceva n-a mers. Apasă /start.",
  },
};
