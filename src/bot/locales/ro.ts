import type { Messages } from "./ru";

export const ro: Messages = {
  start: {
    welcome:
      "👋 Salut! Sunt botul «Alimentează-te inteligent» — te ajut să nu plătești extra în Transnistria și Moldova.\n\nCâteva întrebări scurte. Apoi 3 zile gratuit: îți scriu dacă merită să alimentezi azi.",
    language: "🌐 Выбери язык / Alege limba",
  },
  onboarding: {
    country: "🗺 De unde te alimentezi?",
    countryPmr: "Transnistria",
    countryMd: "Moldova",
    city: "📍 În ce oraș te alimentezi? Scrie numele exact — în rusă sau română, unul din orașele Moldovei.\nDe exemplu: {examples}",
    cityPmr: "📍 Alege orașul:",
    cityUnknown:
      "🤔 Acesta nu e un oraș din listă. Scrie un nume corect — în rusă sau română, dintre orașele Moldovei.\nDe exemplu: {examples}",
    cityUnknownPmr: "🤔 Alege orașul de pe butoanele de mai jos.",
    car: "🚗 Marca și modelul mașinii într-un mesaj.\nDe exemplu: Volkswagen Golf",
    propulsion: "⛽ Cu ce alimentezi mașina?",
    gasoline: "⛽ Benzină",
    diesel: "🛢 Motorină",
    lpg: "🔥 GPL",
    fillGrade: "⛽ Ce benzină pui de obicei?",
    consumption: "📊 Consum mediu, l/100 km. De exemplu: 8.5",
    dailyKm: "🛣 Câți kilometri faci pe zi, aproximativ? De exemplu: 40",
    watchFuels:
      "🔔 Pentru ce combustibili vrei alerte? Bifează — poți alege mai multe, inclusiv sorturile de benzină. Când termini — «Gata».",
    watchSelected: "✅ Alerte: {list}",
    watchNone: "⚪️ Deocamdată nimic selectat.",
    watchDone: "✅ Gata",
    skip: "⏭ Să nu răspund",
    back: "⬅️ Înapoi",
    skipLong: "Urmează acordul pentru 3 zile gratuite.",
    trialAsk:
      "🎁 3 zile gratuit — alerte «merită să alimentezi azi» și calculul economiei. Apoi abonament în Stars. Încercăm?",
    trialYes: "✨ Încerc 3 zile",
    trialNo: "⏳ Mai târziu",
    trialDeclined:
      "👌 Profilul e salvat. Când ești gata — apasă «⭐ Abonament» sau /subscribe.",
    done: "🎉 Gata. Cele 3 zile de probă sunt pornite: îți scriu când merită să alimentezi azi.",
  },
  prices: {
    today: "⛽ Prețurile de azi · {city}",
    stations: "📍 Stații în oraș (întâi cele mai ieftine):",
    stationsCap: "Am arătat până la 8 stații, ca mesajul să nu fie prea lung.",
    noStations: "📍 Pentru acest oraș încă n-am găsit stații cu prețuri.",
    empty: "⛽ Acum n-am putut lua prețurile. Revin mai târziu în alerte.",
    map: "🗺 Hartă",
  },
  menu: {
    title: "🏠 Meniu principal",
    savings: "💰 Economie / clasament",
    budget: "📅 Buget lunar",
    subscribe: "⭐ Abonament",
    leaderboard: "🏆 Clasament",
    settings: "⚙️ Setări",
    language: "🌐 Limbă",
  },
  subscription: {
    trial: "🎁 Ai 3 zile gratuite. Apoi — abonament în Stars.",
    pay: "⭐ Activează abonamentul",
    active: "✅ Abonamentul este activ până la {date}.",
    complimentary:
      "💚 Luna aceasta accesul este deschis. Alimentează-te liniștit — suntem pe fază cu prețurile.",
    expired:
      "⏰ Perioada de probă s-a încheiat. Pentru alerte și economie, activează abonamentul.",
    invoiceDescription: "Alerte personale și calculul economiei pentru o lună",
  },
  alert: {
    hikeToday:
      "⛽ Merită să alimentezi azi.\nMâine {fuel} în {region} — reper {amount}.",
    hikeNeighbor: "⛽ Alimentează-te azi: mâine, cel mai probabil, se scumpește.",
    hike: "⛽ Pentru {fuel} în {region} reperul este {amount}. Merită să alimentezi în orele următoare.",
    up: "📈 {fuel}: {amount} ({region}).",
    down: "📉 {fuel} a scăzut la {amount} ({region}).",
    fillAsk: "❓ Alimentezi azi?",
    fillYes: "✅ Da, alimentez",
    fillNo: "❌ Nu",
    fillSaved: "👍 Ok, am notat. Dacă prețul crește — calculez economia.",
    fillSkipped: "👌 Bine, sărim peste data asta.",
    fillMissing: "🤔 N-am găsit un semnal recent. Așteaptă alerta următoare.",
  },
  guarantee: {
    complimentaryGranted:
      "💚 Luna aceasta abonamentul e din partea noastră. Folosește alertele ca de obicei — alimentează-te mai liniștit.",
  },
  leaderboard: {
    title: "🏆 Cine a economisit cel mai mult",
    empty: "🌱 Încă e devreme pentru clasament — apare după primele «da, alimentez».",
    line: "{place}. {name} — {amount}",
  },
  savings: {
    empty: "📭 Încă nu e economie. Așteaptă semnalul și apasă «Da, alimentez».",
    summary: "💰 Economia ta: {amount} (circa {liters} l).",
    needProfile:
      "📝 Ca să calculez economia, am nevoie de consum și km pe zi. Răspunzi la întrebările sărite?",
    needYes: "✅ Da, răspund",
    congrats:
      "🎉 Bravo — acționezi inteligent!\nIeri ai economisit {amount}.",
    needNumbers:
      "📊 Fără consum și km pe zi nu pot calcula suma — completează la «Economie / clasament».",
  },
  errors: {
    number: "🔢 Trebuie un număr, încearcă din nou.",
    generic: "⚠️ Ceva n-a mers. Apasă /start.",
  },
  settings: {
    title: "⚙️ Setări",
    dash: "nespecificat",
    hint: "✏️ Ce schimbi?",
    language: "🌐 Limbă",
    country: "🗺 Regiune",
    city: "📍 Oraș",
    fuel: "⛽ Combustibil",
    consumption: "📊 Consum",
    dailyKm: "🛣 Km/zi",
    alerts: "🔔 Alerte",
    close: "🏠 Meniu",
    lineLang: "🌐 Limbă: {value}",
    lineCountry: "🗺 Regiune: {value}",
    lineCity: "📍 Oraș: {value}",
    lineFuel: "⛽ Combustibil: {value}",
    lineConsumption: "📊 Consum: {value}",
    lineDailyKm: "🛣 Km/zi: {value}",
    lineAlerts: "🔔 Alerte: {value}",
    consumptionValue: "{n} l/100 km",
    dailyKmValue: "{n} km",
    saved: "✅ Salvat.",
  },
};
