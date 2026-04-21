1. Obiectivul final

Input:

o radiografie panoramică

Output:

fiecare dinte segmentat și numerotat FDI
fiecare dinte cu status clinic estimat
localizare pentru anomalii unde se poate

Exemplu de output:

{
  "teeth": [
    {
      "fdi": 16,
      "bbox": [x1, y1, x2, y2],
      "findings": ["caries", "filling"]
    },
    {
      "fdi": 11,
      "findings": ["endodontic"]
    },
    {
      "fdi": 36,
      "findings": ["implant"]
    },
    {
      "fdi": 26,
      "findings": ["missing"]
    }
  ]
}
2. Arhitectura recomandată

Nu aș face un singur model pentru tot.

Aș face 3 componente:

A. Tooth instance segmentation + FDI numbering

Model:

Mask R-CNN sau Detectron2 Mask R-CNN

Rol:

detectează fiecare dinte
produce mask per dinte
atribuie FDI
B. Tooth-level diagnosis

Model:

ResNet50 / EfficientNet
intrare = crop pe fiecare dinte

Rol:

clasifică dintele:
normal
caries
endodontic
implant
filling
crown
missing
uncertain
C. Global pathology detector

Model:

Faster R-CNN / YOLO / Mask R-CNN

Rol:

detectează lucruri care pot depăși granița unui singur dinte sau au nevoie de localizare clară:
bridge
caries localizate
implant
restorations mari
eventual leziuni periapicale, dacă vei vrea mai târziu
3. Strategia cea mai bună: implementare pe faze
Faza 1 — infrastructura de date

Scop:

să ai dataset curat, consistent și ușor de extins
Ce faci
standardizezi imaginile
verifici COCO-ul existent
separi taskurile de anotare în două dataseturi logice:
dataset dinți + FDI
dataset patologii / lucrări
definești schema finală de labels
Rezultat
un dataset stabil pe care poți itera fără haos
Faza 2 — segmentarea dinților + FDI numbering

Scop:

să obții poziția fiecărui dinte cu mask și clasă FDI
Input
panoramice
anotări COCO pentru fiecare dinte
Clase
11, 12, 13 ... 48
background
Model
Mask R-CNN cu backbone ResNet50-FPN
Output
boxes
masks
labels
scores
De ce începi cu asta

Pentru că tot sistemul tău depinde de localizarea și identitatea corectă a dintelui.

Criterii de succes
dinții sunt separați bine
numerotarea FDI e stabilă
overlap bun pe mască
Faza 3 — generator de tooth crops

Scop:

să construiești automat dataset pentru clasificarea per dinte
Ce faci
rulezi segmentatorul sau folosești ground truth masks
extragi crop pentru fiecare dinte
salvezi:
imagine crop
id FDI
metadate
adaugi context mic în jurul dintelui
De ce

Un classifier pe dinte va merge mai bine decât un classifier pe toată panorama pentru:

endodontic
filling
implant
crown
missing
Faza 4 — clasificare per dinte

Scop:

să obții statusul general al fiecărui dinte
Clase inițiale recomandate

Aș merge pe:

normal
caries
endodontic
implant
filling
crown
missing
root_remnant
uncertain
Observații
missing nu este mereu un crop clasic, pentru că uneori nu ai dinte deloc
pentru missing, vei avea nevoie și de logică bazată pe lipsa unui FDI într-o zonă a arcadei
Model
ResNet50 sau EfficientNet-B0/B2
Rezultat

Pentru fiecare dinte:

etichetă principală
scor de încredere
Criterii de succes
implanturile și endodonticul să meargă bine devreme
filling-urile rezonabil
cariile pot fi mai dificile și pot necesita model separat
Faza 5 — detector global de patologii și lucrări

Scop:

să prinzi ce nu merge bine doar din crop pe dinte
Clase recomandate
caries
bridge
implant
filling_large
endodontic_material
crown
opțional: periapical_lesion
De ce ai nevoie de acest model

Pentru:

bridge poate implica mai mulți dinți
caries uneori trebuie localizată
unele lucrări sunt mai ușor de văzut în context global
Model
YOLO dacă vrei viteză
Faster R-CNN dacă vrei pipeline mai apropiat de restul
Mask R-CNN dacă ai masks bune
Criterii de succes
localizare decentă pe panorama completă
bun pentru mapping la dinți
Faza 6 — logic layer de asociere

Scop:

să legi findings-urile de dintele corect
Reguli de bază

Pentru fiecare finding global:

verifici intersecția cu bbox/mask al fiecărui dinte
alegi dintele cu overlap maxim
dacă finding-ul atinge mai mulți dinți, îl marchezi ca multi-tooth
Exemple
caries cu overlap mare pe 16 -> tooth 16
bridge peste 14,15,16 -> asociere multi-tooth
implant în poziția 46 -> tooth 46
Rezultat

Construiești raportul final orientat pe dinte.

Faza 7 — missing tooth logic

Scop:

să detectezi corect lipsa unui dinte

Aici nu m-aș baza doar pe classifier.

Metodă recomandată
modelul de segmentare încearcă să găsească toți dinții prezenți
ai așteptări anatomice despre FDI
dacă lipsește un dinte din secvență și poziția e coerentă anatomic, îl marchezi missing
Exemplu

Dacă ai 25 și 27 identificate stabil, dar 26 lipsește:

candidate missing = 26
Important

Pentru missing, logica topologică + FDI e foarte valoroasă.

Faza 8 — evaluare clinică și QA

Scop:

să nu te minți cu metrici bune pe hârtie și rezultate slabe în realitate
Evaluezi separat
tooth segmentation
FDI assignment
tooth classification
pathology localization
final tooth report accuracy
Metrici

Pentru segmentare:

mAP
IoU / Dice

Pentru clasificare:

accuracy
precision / recall / F1 per clasă

Pentru sistem final:

exactitatea raportului pe dinte:
FDI 16 -> caries
FDI 36 -> implant