// "Poklon se otvara": klik na ikonicu dana sa grebalicom → ikonica (ista slika iz admina)
// se protrese, poklopac odleti, blesne svetlo → iskoči grebalica.
//
// Radi odmah, CSS animacijom. Kad dizajner isporuči /rive/poklon.riv, automatski se koristi Rive.
export const GIFT_OPEN = {
  enabled: true,
  onlyScratch: true, // samo dani sa uključenom grebalicom
  onlyFirstTime: true, // već ogreban dan se otvara odmah, bez animacije
  // posle grebanja ikonica dana postaje otvoren poklon (kraj animacije iz poklon.riv). null = ostaje ikonica iz admina
  openedIcon: "/rive/poklon-otvoren.webp",

  // CSS verzija: gde je donja ivica poklopca na ikonici (0 = vrh, 1 = dno)
  lidSplit: 0.52,
  revealAfter: 850, // ms od klika do pop-upa sa grebalicom

  // Rive verzija — dogovor sa dizajnerom
  rive: {
    src: "/rive/poklon.riv",
    stateMachine: "Poklon",
    trigger: "open", // trigger u view modelu "Poklon" koji pokreće otvaranje
    // opciono: slika u fajlu sa ovim imenom (Referenced) menja se ikonicom dana iz admina.
    // poklon.riv je nema — poklon je nacrtan u Rive-u, isti za sve dane.
    imageAsset: "ikonica",
    // artboard je kvadrat, ikonica zauzima ovaj deo širine u sredini (ostalo je prostor za efekte)
    iconScale: 0.5,
    revealAfter: 1100,
  },
};
