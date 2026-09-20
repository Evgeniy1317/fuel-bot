import type { Messages } from "./ru";

export const ro: Messages = {
  start: {
    welcome:
      "Salut! Sunt botul «Alimentează-te inteligent» — te ajut să economisești la combustibil în Transnistria și Moldova.\n\nCâteva întrebări scurte. Apoi îți pot da 3 zile gratuit: îți scriu în chat dacă merită să alimentezi azi.",
    language: "Выбери язык / Alege limba",
  },
  onboarding: {
    country: "De unde te alimentezi?",
    countryPmr: "Transnistria",
    countryMd: "Moldova",
    city: "În ce oraș te alimentezi? Scrie numele în rusă sau română.\nDe exemplu: {examples}",
    cityUnknown:
      "Nu am recunoscut orașul. Scrie din nou — în rusă sau română.\nDe exemplu: {examples}",
    car: "Marca și modelul mașinii într-un mesaj.\nDe exemplu: Volkswagen Golf",
    propulsion: "Cu ce alimentezi mașina?",
    gasoline: "Benzină",
    diesel: "Motorină",
    lpg: "GPL",
    fillGrade: "Ce benzină pui de obicei?",
    consumption:
      "Consum mediu, l/100 km. Un număr, de exemplu: 8.5",
    dailyKm: "Câți kilometri faci aproximativ pe zi? De exemplu: 40",
    watchFuels:
      "Pentru ce tipuri de combustibil vrei alerte? Poți alege mai multe: benzină, motorină, GPL. Apasă din nou ca să scoți bifa. Când termini — «Gata».",
    watchSelected: "Alerte: {list}",
    watchNone: "Deocamdată nimic selectat.",
    watchDone: "Gata",
    skip: "Să nu răspund",
    back: "← Înapoi",
    skipLong: "Urmează acordul pentru 3 zile gratuite.",
    trialAsk:
      "3 zile gratuit — alerte «merită să alimentezi azi» și calculul pentru mașina ta. Apoi abonament în Stars. Încercăm?",
    trialYes: "Încerc 3 zile",
    trialNo: "Mai târziu",
    trialDeclined:
      "Ok, profilul e salvat. Când ești gata — apasă «Abonament» sau /subscribe.",
    done: "Gata. Cele 3 zile de probă sunt pornite: îți scriu în chat când merită să alimentezi azi.",
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
    trial: "Ai 3 zile gratuite. Apoi — abonament în Stars.",
    pay: "Activează abonamentul",
    active: "Abonamentul este activ până la {date}.",
    complimentary:
      "Luna aceasta accesul este deschis. Alimentează-te liniștit — suntem pe fază cu prețurile.",
    expired:
      "Perioada de probă s-a încheiat. Pentru alerte și calculul economiei, activează abonamentul.",
    invoiceDescription: "Alerte personale și calculul economiei pentru o lună",
  },
  alert: {
    hikeToday:
      "Merită să alimentezi azi. Mâine {fuel} în {region} — reper {amount} {currency}.",
    hikeNeighbor:
      "Alimentează-te azi: mâine se scumpește.",
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
