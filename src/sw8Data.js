export const SW8_AREAS = [
  {
    name: 'Dlaczego?',
    question: 'Dlaczego podejmujemy ten kierunek i po co firma istnieje?',
    outcome: 'Jasne uzasadnienie kierunku strategicznego, cele oraz długofalowy sens i ambicja organizacji.',
    foundation: {
      name: 'Uzasadnienie strategiczne / Dlaczego teraz',
      answer: 'Jedno jasne uzasadnienie, dlaczego właśnie ten kierunek jest ważny i dlaczego powinien być realizowany teraz.'
    },
    blocks: [
      ['Czynniki strategiczne', 'Co naprawdę uzasadnia potrzebę zmiany / działania?'],
      ['Odpowiedzi strategiczne', 'Jak świadomie odpowiadamy na wybrane czynniki?'],
      ['Cele strategiczne', 'Co konkretnie ma być prawdą za 6–12 miesięcy?'],
      ['Uzasadnienie strategiczne / Dlaczego teraz', 'Dlaczego właśnie ten kierunek i dlaczego teraz?', true],
      ['Sens istnienia', 'Jaką wartościową zmianę firma chce powodować?'],
      ['Wizja', 'Dokąd firma zmierza i jak wygląda sukces 3–5 lat?'],
      ['Ambicja właściciela / zespołu', 'Co właściciel / zespół chce zbudować, a czego nie chce?']
    ],
    completion: 'Wszystkie wymagane elementy są ukończone, fundament jest ukończony, żaden wymagany element nie wymaga przeglądu, a cele mają jasne powiązanie z czynnikami i odpowiedziami strategicznymi.'
  },
  {
    name: 'Kto?',
    question: 'Kim jesteśmy jako marka i jaką tożsamość chcemy konsekwentnie wyrażać?',
    outcome: 'Spójny system tożsamości: wiemy, kim marka jest, jaki ma charakter oraz jak ten charakter powinien być wyrażany werbalnie i wizualnie.',
    foundation: {
      name: 'Rdzeń tożsamości marki',
      answer: 'Jednoznaczny rdzeń tego, kim marka jest i jak chce być rozumiana, bez dublowania pełnej definicji osobowości.'
    },
    blocks: [
      ['Rdzeń tożsamości marki', 'Kim jesteśmy jako marka i jak chcemy być rozumiani?', true],
      ['Osobowość marki', 'Jaki charakter i postawę marka ma konsekwentnie reprezentować?'],
      ['Zasady ekspresji', 'Jak ten charakter powinien brzmieć i zachowywać się w komunikacji?'],
      ['Kierunek wizualny', 'Jakie zasady wizualne powinny wyrażać tę samą tożsamość i osobowość?']
    ],
    completion: 'Cztery wymagane elementy są ukończone, są wzajemnie spójne i można na ich podstawie odrzucić decyzję werbalną lub wizualną jako „nie naszą”.'
  },
  {
    name: 'Do kogo?',
    question: 'Do kogo świadomie kierujemy ofertę?',
    outcome: 'Świadomy wybór odbiorcy i zrozumienie sytuacji, w której oferta staje się dla niego istotna.',
    foundation: {
      name: 'Priorytetowy odbiorca',
      answer: 'Wskazanie jednego lub kilku priorytetowych segmentów / typów klientów wraz ze świadomym określeniem, kto nie jest priorytetem.'
    },
    blocks: [
      ['Priorytetowy odbiorca', 'Kogo uznajemy za priorytetowego odbiorcę / klienta?', true],
      ['Sytuacja klienta / wyzwalacz potrzeby', 'W jakiej sytuacji problem / potrzeba staje się dla tego odbiorcy istotna?']
    ],
    completion: 'Oba elementy są ukończone, wybór odbiorcy ma jasne uzasadnienie, a sytuacja klienta / wyzwalacz potrzeby są wystarczająco konkretne, by zasilać ofertę bez konieczności czytania całej persony.'
  },
  {
    name: 'W jakim kontekście?',
    question: 'W jakiej przestrzeni rynkowej jesteśmy oceniani i jakie miejsce chcemy w niej zajmować?',
    outcome: 'Jasna rama konkurencyjna i pozycja marki wynikająca z realnych alternatyw dostępnych właściwemu odbiorcy.',
    foundation: {
      name: 'Rama pozycjonowania',
      answer: 'Zwięzła rama określająca, w jakim kontekście / kategorii marka ma być rozumiana oraz jakie miejsce chce zajmować względem istotnych alternatyw.'
    },
    blocks: [
      ['Rama rynku / kategorii', 'W jakiej kategorii / przestrzeni rynkowej chcemy być rozumiani?'],
      ['Istotne alternatywy', 'Z czym właściwy odbiorca realnie nas porównuje?'],
      ['Wyróżnik / powód wyboru', 'Jaka znacząca różnica ma wspierać wybór naszej marki?'],
      ['Rama pozycjonowania', 'Jakie miejsce chcemy świadomie zajmować w tym kontekście?', true]
    ],
    completion: 'Wszystkie cztery wymagane elementy są ukończone, pozycjonowanie wynika z realnego kontekstu i dowodów, a zespół potrafi odpowiedzieć, wobec czego klient nas wybiera i jakie miejsce chcemy wtedy zajmować.'
  },
  {
    name: 'Co?',
    question: 'Co konkretnie oferujemy i jaką zmianę / wartość obiecujemy właściwemu odbiorcy?',
    outcome: 'Oferta zrozumiała jako obiecana zmiana, mechanizm wartości oraz konkretna struktura tego, co klient otrzymuje.',
    foundation: {
      name: 'Rdzeń propozycji oferty',
      answer: 'Zwięzłe określenie tego, co oferujemy, komu, jaką zmianę / wartość dostarczamy i przez jaki podstawowy mechanizm.'
    },
    blocks: [
      ['Obietnica oferty / zmiana', 'Jaka zmiana lub rezultat ma nastąpić po skorzystaniu z oferty?'],
      ['Mechanizm oferty / wartość', 'Dzięki czemu oferta ma dostarczyć tę zmianę i jaka wartość powstaje dla klienta?'],
      ['Architektura oferty', 'Co dokładnie otrzymuje klient i jak zbudowana jest oferta?'],
      ['Rdzeń propozycji oferty', 'Jak w jednym spójnym ujęciu opisujemy ofertę?', true]
    ],
    completion: 'Wszystkie cztery wymagane elementy są ukończone, odbiorca może zrozumieć obiecywaną wartość bez pełnego copy, a architektura oferty rzeczywiście wspiera obiecaną zmianę.'
  },
  {
    name: 'Jak?',
    question: 'Jak prowadzimy priorytetowego odbiorcę od uwagi i zainteresowania do decyzji, wdrożenia i dalszej relacji?',
    outcome: 'Spójny system prowadzenia priorytetowego odbiorcy od uwagi i rozważania przez decyzję do wdrożenia / dalszej relacji, wraz z logiką pomiaru jego skuteczności.',
    foundation: {
      name: 'Logika wejścia na rynek',
      answer: 'Zwięzły model wyjaśniający, jak firma zamienia uwagę właściwego odbiorcy w relację, zakup i dalsze zaangażowanie oraz po czym poznaje, że system działa.'
    },
    blocks: [
      ['Model progresji klienta', 'Jakie stany / etapy przechodzi odbiorca i co oznacza progres?'],
      ['Kluczowe mechanizmy działania', 'Jakimi powtarzalnymi strategicznymi mechanizmami przesuwamy odbiorcę dalej?'],
      ['Mechanizm konwersji i relacji', 'Jak zainteresowanie staje się decyzją / zakupem, wdrożeniem i relacją?'],
      ['Sygnały sukcesu', 'Po czym poznajemy, że mechanika działa?'],
      ['Logika wejścia na rynek', 'Jak ten system działa jako całość?', true]
    ],
    completion: 'Wszystkie wymagane elementy są ukończone, mechanika nie zależy od jednej konkretnej platformy, a zespół potrafi wyjaśnić zarówno przepływ klienta, jak i niewielki zestaw sygnałów potwierdzających skuteczność.'
  },
  {
    name: 'Gdzie?',
    question: 'W jakich kanałach / miejscach powinniśmy być obecni, żeby skutecznie realizować przyjętą logikę wejścia na rynek?',
    outcome: 'Świadomie ograniczony portfel kanałów, w których realizujemy logikę wejścia na rynek.',
    foundation: {
      name: 'Priorytetowy portfel kanałów',
      answer: 'Ograniczony, priorytetyzowany zestaw kanałów wraz z jasną rolą każdego z nich oraz świadomą decyzją, czego teraz nie rozwijamy.'
    },
    blocks: [
      ['Priorytetowy portfel kanałów', 'Gdzie realnie powinniśmy inwestować uwagę i zasoby?', true]
    ],
    completion: 'Priorytetowy portfel kanałów jest ukończony i zespół potrafi uzasadnić zarówno obecność w wybranych kanałach, jak i brak inwestycji w pozostałe na podstawie logiki wejścia na rynek i dostępnych dowodów.'
  },
  {
    name: 'Kiedy?',
    question: 'Co robimy najpierw, co później i po czym wiemy, że można przejść do kolejnego etapu?',
    outcome: 'Strategiczne założenia przełożone na sensowną kolejność ruchów w czasie oraz kryteria przejścia pomiędzy etapami.',
    foundation: {
      name: 'Sekwencja strategiczna',
      answer: 'Jasna kolejność najważniejszych ruchów: co jest teraz, co potem i dlaczego taka kolejność najlepiej wspiera cele.'
    },
    blocks: [
      ['Sekwencja strategiczna', 'Co robimy najpierw, co później i dlaczego taka kolejność ma sens?', true],
      ['Długoterminowa ścieżka rozwoju', 'Jakie większe jakościowe etapy rozwoju przewidujemy w dłuższej perspektywie?'],
      ['Kamienie milowe / kryteria przejścia', 'Po czym poznajemy, że etap został osiągnięty i można przejść dalej?']
    ],
    completion: 'Trzy wymagane elementy są ukończone, sekwencja działań wynika z celów, długoterminowa ścieżka z wizji i ambicji, a kluczowe przejścia mają jawne kamienie milowe / kryteria zamiast samej daty.'
  }
]
