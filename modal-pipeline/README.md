# 🦷 Dental Tooth Segmentation Pipeline (Modal)

Acest proiect automatizează procesul de antrenare și predicție pentru detecția și segmentarea dinților pe radiografii panoramice, folosind platforma cloud **Modal** și modelul **YOLOv8-seg**.

## 📁 Structura Proiectului
- `models/config.py`: Definirea mediului cloud.
- `models/preprocessing.py`: Algoritmi de îmbunătățire a imaginii.
- `models/train.py`: Scriptul principal de antrenare.
- `models/inference.py`: Scriptul pentru vizualizare contururi inteligente (SAM).
- `dataset/`: Datele de antrenament.

---

## 🚀 Comenzi Rapide

### 1. Încărcarea Dataset-ului în Cloud
Înainte de orice antrenare, trebuie să urci imaginile pe volumul persistent Modal:
```bash
modal volume put dental-data-storage ./dataset /dataset
```

### 2. Pornirea Antrenării
```bash
modal run models/train.py --epochs 50 --batch-size 16
```
*   **Parametri modificabili**:
    *   `--epochs`: Numărul de iterații (recomandat 50-100 pentru rezultate bune).
    *   `--batch-size`: Câte imagini vede modelul deodată (depinde de memoria GPU).

### 3. Execuția Predicției (Inferența)
```bash
modal run models/inference.py --image-path test.jpg
```
*Rezultatul va fi un fișier `result_contour.jpg` descărcat automat în folderul curent.*

---

## ⚙️ Parametri Tehnici (Modificabili în cod)

### În `train.py`:
- `gpu="A10G"`: Poți schimba cu `"T4"` (mai ieftin) sau `"A100"` (cel mai rapid).
- `model = YOLO("yolov8n-seg.pt")`:
    - `yolov8n-seg`: Varianta Nano (ultra rapidă, precizie medie).
    - `yolov8m-seg`: Varianta Medium (echilibru bun).
    - `yolov8x-seg`: Varianta Extra-large (cea mai mare precizie, necesită GPU puternic).

### În `preprocessing.py`:
- `clipLimit=2.0`: Controlează intensitatea contrastului CLAHE (lucrarea originală folosește 2.0).
- `tileGridSize=(8, 8)`: Granularitatea contrastului.

---

## ⚠️ Notă despre Dataset
Pentru a vedea **contururi curbe**, dataset-ul din `dataset/labels` trebuie să conțină poligoane. Fișierele `.txt` ar trebui să aibă linii cu peste 10 numere. Dacă liniile au doar 5 numere, modelul va detecta doar chenare rectangulare.
