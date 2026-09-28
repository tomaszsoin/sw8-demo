export const SW8_AREAS = [
  {
    name: 'Dlaczego?',
    question: 'Dlaczego podejmujemy ten kierunek i po co firma istnieje?',
    outcome: 'Jasne uzasadnienie kierunku strategicznego, cele oraz długofalowy sens i ambicja organizacji.',
    foundation: {
      name: 'Strategic Rationale / Why Now',
      answer: 'Jedno jasne uzasadnienie, dlaczego właśnie ten kierunek jest ważny i dlaczego powinien być realizowany teraz.'
    },
    blocks: [
      ['Strategic Drivers', 'Co naprawdę uzasadnia potrzebę zmiany / działania?'],
      ['Strategic Responses', 'Jak świadomie odpowiadamy na wybrane drivery?'],
      ['Strategic Goals', 'Co konkretnie ma być prawdą za 6–12 miesięcy?'],
      ['Strategic Rationale / Why Now', 'Dlaczego właśnie ten kierunek i dlaczego teraz?', true],
      ['Purpose', 'Jaką wartościową zmianę firma chce powodować?'],
      ['Vision', 'Dokąd firma zmierza i jak wygląda sukces 3–5 lat?'],
      ['Founder / Team Ambition', 'Co właściciel / zespół chce zbudować, a czego nie chce?']
    ],
    completion: 'Wszystkie required Blocks są complete, Foundation jest complete, żaden required Block nie wymaga review, a cele mają traceability do driverów i responses.'
  },
  {
    name: 'Kto?',
    question: 'Kim jesteśmy jako marka i jaką tożsamość chcemy konsekwentnie wyrażać?',
    outcome: 'Spójny system tożsamości: wiemy, kim marka jest, jaki ma charakter oraz jak ten charakter powinien być wyrażany werbalnie i wizualnie.',
    foundation: {
      name: 'Brand Identity Core',
      answer: 'Jednoznaczny rdzeń tego, kim marka jest i jak chce być rozumiana, bez dublowania pełnej definicji osobowości.'
    },
    blocks: [
      ['Brand Identity Core', 'Kim jesteśmy jako marka i jak chcemy być rozumiani?', true],
      ['Brand Personality', 'Jaki charakter i postawę marka ma konsekwentnie reprezentować?'],
      ['Expression Principles', 'Jak ten charakter powinien brzmieć i zachowywać się w komunikacji?'],
      ['Visual Direction', 'Jakie zasady wizualne powinny wyrażać tę samą tożsamość i osobowość?']
    ],
    completion: 'Cztery required Blocks są complete, są wzajemnie spójne i można na ich podstawie odrzucić decyzję werbalną lub wizualną jako „nie naszą”.'
  },
  {
    name: 'Do kogo?',
    question: 'Do kogo świadomie kierujemy ofertę?',
    outcome: 'Świadomy wybór odbiorcy i zrozumienie sytuacji, w której oferta staje się dla niego istotna.',
    foundation: {
      name: 'Priority Audience',
      answer: 'Wskazanie jednego lub kilku priorytetowych segmentów / typów klientów wraz ze świadomym określeniem, kto nie jest priorytetem.'
    },
    blocks: [
      ['Priority Audience', 'Kogo uznajemy za priorytetowego odbiorcę / klienta?', true],
      ['Customer Situation / Trigger', 'W jakiej sytuacji problem / potrzeba staje się dla tego odbiorcy istotna?']
    ],
    completion: 'Oba Blocks są complete, wybór odbiorcy ma jasne uzasadnienie, a Customer Situation / Trigger jest wystarczająco konkretne, by zasilać ofertę bez konieczności czytania całej persony.'
  },
  {
    name: 'W jakim kontekście?',
    question: 'W jakiej przestrzeni rynkowej jesteśmy oceniani i jakie miejsce chcemy w niej zajmować?',
    outcome: 'Jasna rama konkurencyjna i pozycja marki wynikająca z realnych alternatyw dostępnych właściwemu odbiorcy.',
    foundation: {
      name: 'Positioning Frame',
      answer: 'Zwięzła rama określająca, w jakim kontekście / kategorii marka ma być rozumiana oraz jakie miejsce chce zajmować względem istotnych alternatyw.'
    },
    blocks: [
      ['Market / Category Frame', 'W jakiej kategorii / przestrzeni rynkowej chcemy być rozumiani?'],
      ['Relevant Alternatives', 'Z czym właściwy odbiorca realnie nas porównuje?'],
      ['Differentiation / Reason to Choose', 'Jaka znacząca różnica ma wspierać wybór naszej marki?'],
      ['Positioning Frame', 'Jakie miejsce chcemy świadomie zajmować w tym kontekście?', true]
    ],
    completion: 'Wszystkie cztery required Blocks są complete, Positioning wynika z realnego kontekstu i evidence, a zespół potrafi odpowiedzieć, wobec czego klient nas wybiera i jakie miejsce chcemy wtedy zajmować.'
  },
  {
    name: 'Co?',
    question: 'Co konkretnie oferujemy i jaką zmianę / wartość obiecujemy właściwemu odbiorcy?',
    outcome: 'Oferta zrozumiała jako obiecana zmiana, mechanizm wartości oraz konkretna struktura tego, co klient otrzymuje.',
    foundation: {
      name: 'Core Offer Proposition',
      answer: 'Zwięzłe określenie tego, co oferujemy, komu, jaką zmianę / wartość dostarczamy i przez jaki podstawowy mechanizm.'
    },
    blocks: [
      ['Offer Promise / Transformation', 'Jaka zmiana lub rezultat ma nastąpić po skorzystaniu z oferty?'],
      ['Offer Mechanism / Value', 'Dzięki czemu oferta ma dostarczyć tę zmianę i jaka wartość powstaje dla klienta?'],
      ['Offer Architecture', 'Co dokładnie otrzymuje klient i jak zbudowana jest oferta?'],
      ['Core Offer Proposition', 'Jak w jednym spójnym ujęciu opisujemy ofertę?', true]
    ],
    completion: 'Wszystkie cztery required Blocks są complete, odbiorca może zrozumieć obiecywaną wartość bez pełnego copy, a architektura oferty rzeczywiście wspiera obiecaną transformację.'
  },
  {
    name: 'Jak?',
    question: 'Jak prowadzimy priorytetowego odbiorcę od uwagi i zainteresowania do decyzji, wdrożenia i dalszej relacji?',
    outcome: 'Spójny system prowadzenia priorytetowego odbiorcy od uwagi i rozważania przez decyzję do wdrożenia / dalszej relacji, wraz z logiką pomiaru jego skuteczności.',
    foundation: {
      name: 'Go-to-Market Logic',
      answer: 'Zwięzły model wyjaśniający, jak firma zamienia uwagę właściwego odbiorcy w relację, zakup i dalsze zaangażowanie oraz po czym poznaje, że system działa.'
    },
    blocks: [
      ['Customer Progression Model', 'Jakie stany / etapy przechodzi odbiorca i co oznacza progres?'],
      ['Core Motions', 'Jakimi powtarzalnymi strategicznymi mechanizmami przesuwamy odbiorcę dalej?'],
      ['Conversion & Relationship Mechanism', 'Jak zainteresowanie staje się decyzją / zakupem, wdrożeniem i relacją?'],
      ['Success Signals', 'Po czym poznajemy, że mechanika działa?'],
      ['Go-to-Market Logic', 'Jak ten system działa jako całość?', true]
    ],
    completion: 'Wszystkie required Blocks są complete, mechanika nie zależy od jednej konkretnej platformy, a zespół potrafi wyjaśnić zarówno przepływ klienta, jak i niewielki zestaw sygnałów potwierdzających skuteczność.'
  },
  {
    name: 'Gdzie?',
    question: 'W jakich kanałach / miejscach powinniśmy być obecni, żeby skutecznie realizować przyjętą Go-to-Market Logic?',
    outcome: 'Świadomie ograniczony portfel kanałów, w których realizujemy Go-to-Market Logic.',
    foundation: {
      name: 'Priority Channel Portfolio',
      answer: 'Ograniczony, priorytetyzowany zestaw kanałów wraz z jasną rolą każdego z nich oraz świadomą decyzją, czego teraz nie rozwijamy.'
    },
    blocks: [
      ['Priority Channel Portfolio', 'Gdzie realnie powinniśmy inwestować uwagę i zasoby?', true]
    ],
    completion: 'Priority Channel Portfolio jest complete i zespół potrafi uzasadnić zarówno obecność w wybranych kanałach, jak i brak inwestycji w pozostałe na podstawie GTM i evidence.'
  },
  {
    name: 'Kiedy?',
    question: 'Co robimy najpierw, co później i po czym wiemy, że można przejść do kolejnego etapu?',
    outcome: 'Strategiczne założenia przełożone na sensowną kolejność ruchów w czasie oraz kryteria przejścia pomiędzy etapami.',
    foundation: {
      name: 'Strategic Sequence',
      answer: 'Jasna kolejność najważniejszych ruchów: co jest teraz, co potem i dlaczego taka kolejność najlepiej wspiera cele.'
    },
    blocks: [
      ['Strategic Sequence', 'Co robimy najpierw, co później i dlaczego taka kolejność ma sens?', true],
      ['Long-term Development Path', 'Jakie większe jakościowe etapy rozwoju przewidujemy w dłuższej perspektywie?'],
      ['Milestones / Transition Criteria', 'Po czym poznajemy, że etap został osiągnięty i można przejść dalej?']
    ],
    completion: 'Trzy required Blocks są complete, near-term sequence wynika z celów, long-term path z wizji i ambicji, a kluczowe przejścia mają jawne milestone’y / kryteria zamiast samej daty.'
  }
]
