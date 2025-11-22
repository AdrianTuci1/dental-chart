# SVG Overlay Examples - Exemple Vizuale

## Conceptul de Bază

```
┌─────────────────────────────┐
│                             │
│   PNG Image (Tooth Base)    │  ← Anatomia dintelui (realistic)
│                             │
└─────────────────────────────┘
           ↓ OVERLAY
┌─────────────────────────────┐
│                             │
│   SVG Colored Regions       │  ← Suprafețe colorate (restaurări, patologii)
│                             │
└─────────────────────────────┘
           ↓ RESULT
┌─────────────────────────────┐
│  🦷 Tooth cu zone colorate  │  ← Vizualizare finală
└─────────────────────────────┘
```

---

## Exemplu 1: Obturație Simplă (Single Occlusal Filling)

### Tooth 16 - Vista Ocluzală

```html
<div class="tooth-container" style="position: relative; width: 100px; height: 100px;">
  <!-- PNG de bază -->
  <img 
    src="/assets/teeth/iso16-topview.png" 
    style="position: absolute; width: 100%; height: 100%;"
    alt="Tooth 16 occlusal view"
  />
  
  <!-- SVG Overlay pentru obturație -->
  <svg 
    viewBox="0 0 100 100" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
  >
    <!-- Suprafața ocluzală cu obturație de amalgam -->
    <path 
      d="M 30,30 L 70,30 L 70,70 L 30,70 Z"
      fill="#8B8B8B"
      opacity="0.7"
      stroke="#6B6B6B"
      stroke-width="1"
      data-surface="O"
      data-type="restoration"
      data-material="amalgam"
    />
  </svg>
</div>
```

### Rezultat:
```
     Tooth 16 (First Molar)
     Vista de sus (occlusal)
     
        ┌─────┐
      ┌─┼─────┼─┐
    ┌─┼─┼─────┼─┼─┐
    │ │ │░░░░░│ │ │  ← Zona gri = amalgam pe suprafața O
    └─┼─┼─────┼─┼─┘
      └─┼─────┼─┘
        └─────┘
```

---

## Exemplu 2: Obturație MOD (Mesio-Occlusal-Distal)

### Tooth 24 - Vista Ocluzală

```html
<div class="tooth-container" style="position: relative; width: 100px; height: 100px;">
  <img src="/assets/teeth/iso24-topview.png" />
  
  <svg viewBox="0 0 100 100">
    <!-- Suprafața Mezială (M) -->
    <path 
      d="M 10,20 L 30,30 L 30,70 L 10,80 Z"
      class="restoration-composite surface-M"
      fill="#E8E8E8"
      opacity="0.6"
      stroke="#C8C8C8"
      stroke-width="1"
      data-surface="M"
    />
    
    <!-- Suprafața Ocluzală (O) -->
    <path 
      d="M 30,30 L 70,30 L 70,70 L 30,70 Z"
      class="restoration-composite surface-O"
      fill="#E8E8E8"
      opacity="0.6"
      stroke="#C8C8C8"
      stroke-width="1"
      data-surface="O"
    />
    
    <!-- Suprafața Distală (D) -->
    <path 
      d="M 70,30 L 90,20 L 90,80 L 70,70 Z"
      class="restoration-composite surface-D"
      fill="#E8E8E8"
      opacity="0.6"
      stroke="#C8C8C8"
      stroke-width="1"
      data-surface="D"
    />
  </svg>
</div>
```

### Rezultat:
```
     Tooth 24 (First Premolar)
     MOD Composite Filling
     
        ┌─────┐
      ┌─┼─────┼─┐
    ░░░░░░░░░░░░░░░  ← Composite alb pe M-O-D
      └─┼─────┼─┘
        └─────┘
```

---

## Exemplu 3: Dinte cu Carie ȘI Obturație

### Tooth 36 - Vista Ocluzală

```html
<div class="tooth-container">
  <img src="/assets/teeth/iso36-topview.png" />
  
  <svg viewBox="0 0 100 100">
    <!-- LAYER 1: Obturație veche de amalgam pe O -->
    <path 
      d="M 30,30 L 70,30 L 70,70 L 30,70 Z"
      fill="#8B8B8B"
      opacity="0.7"
      data-surface="O"
      data-type="restoration"
      data-date="2020-03-15"
    />
    
    <!-- LAYER 2: Carie nouă pe D (deasupra obturației) -->
    <path 
      d="M 70,30 L 90,20 L 90,80 L 70,70 Z"
      fill="#8B4513"
      opacity="0.8"
      stroke="#5B2813"
      stroke-width="2"
      data-surface="D"
      data-type="pathology"
      data-subtype="caries"
      data-severity="moderate"
    />
    
    <!-- Indicator vizual pentru carie (optional) -->
    <circle 
      cx="80" 
      cy="50" 
      r="3" 
      fill="#FF4444"
      opacity="0.9"
    />
  </svg>
</div>
```

### Rezultat:
```
     Tooth 36 (Lower First Molar)
     Amalgam + Carie nouă
     
        ┌─────┐
      ┌─┼─────┼─┐
    ┌─░░█████████ ← Gri = amalgam, Maro = carie
    │ ░░█████████
    └─░░█████████
      └─┼─────┼─┘
        └─────┘
```

---

## Exemplu 4: Coroană Completă

### Tooth 11 - Vista Frontală

```html
<div class="tooth-container">
  <img src="/assets/teeth/iso11-frontal.png" />
  
  <svg viewBox="0 0 100 150">
    <!-- Coroană completă - acoperă toată partea vizibilă -->
    <path 
      d="M 10,30 
         Q 10,20 20,15 
         L 80,15 
         Q 90,20 90,30 
         L 90,120 
         Q 50,130 10,120 Z"
      fill="#9575CD"
      opacity="0.5"
      stroke="#7557AD"
      stroke-width="2"
      data-type="restoration"
      data-subtype="crown"
      data-material="porcelain"
    />
    
    <!-- Indicator de coroană (icon) -->
    <text x="50" y="75" 
          font-size="20" 
          text-anchor="middle" 
          fill="#FFFFFF">
      👑
    </text>
  </svg>
</div>
```

---

## Exemplu 5: Fractură

### Tooth 21 - Vista Frontală

```html
<div class="tooth-container">
  <img src="/assets/teeth/iso21-frontal.png" />
  
  <svg viewBox="0 0 100 150">
    <!-- Linie de fractură (nu fill, doar stroke) -->
    <path 
      d="M 45,15 L 50,40 L 55,65 L 48,90"
      fill="none"
      stroke="#FF4444"
      stroke-width="3"
      stroke-dasharray="5,3"
      opacity="0.9"
      data-type="pathology"
      data-subtype="fracture"
    />
    
    <!-- Zonă afectată (umbrită) -->
    <path 
      d="M 45,15 L 60,15 L 58,90 L 48,90 Z"
      fill="#FF4444"
      opacity="0.2"
    />
  </svg>
</div>
```

---

## Exemplu 6: Selecție Interactivă de Suprafețe

```html
<!-- Component React pentru selecție -->
<div class="tooth-container interactive">
  <img src="/assets/teeth/iso14-topview.png" />
  
  <svg viewBox="0 0 100 100">
    <!-- Suprafețe clicabile pentru selecție -->
    
    <!-- Occlusal -->
    <path 
      d="M 30,30 L 70,30 L 70,70 L 30,70 Z"
      class="surface-selectable"
      data-surface="O"
      onclick="handleSurfaceClick('O')"
      style="
        fill: transparent;
        stroke: #E0E0E0;
        stroke-width: 1;
        cursor: pointer;
      "
      onmouseover="this.style.fill='rgba(0,163,224,0.3)'"
      onmouseout="this.style.fill='transparent'"
    />
    
    <!-- Mesial -->
    <path 
      d="M 10,20 L 30,30 L 30,70 L 10,80 Z"
      class="surface-selectable"
      data-surface="M"
      onclick="handleSurfaceClick('M')"
    />
    
    <!-- Similar pentru B, D, L -->
  </svg>
</div>
```

### Comportament:
- **Hover**: Suprafața se iluminează în albastru transparent
- **Click**: Suprafața devine selectată (albastru mai intens)
- **Multiple select**: Shift+Click pentru selecție multiplă

---

## Exemplu 7: Multiple Condiții pe Același Dinte

### Tooth 46 - Vista Ocluzală - Complex

```javascript
const conditions = [
  {
    surface: 'O',
    type: 'restoration',
    subtype: 'amalgam',
    color: '#8B8B8B',
    opacity: 0.7,
    date: '2018-05-10'
  },
  {
    surface: 'M',
    type: 'pathology',
    subtype: 'caries',
    color: '#8B4513',
    opacity: 0.8,
    severity: 'severe',
    date: '2025-01-15'
  },
  {
    surface: 'D',
    type: 'pathology',
    subtype: 'fracture',
    color: '#FF4444',
    opacity: 0.7,
    pattern: 'line',
    date: '2024-11-20'
  }
];
```

```html
<div class="tooth-container">
  <img src="/assets/teeth/iso46-topview.png" />
  
  <svg viewBox="0 0 100 100">
    <!-- Z-index: 3 - Restaurare (mai jos) -->
    <path 
      d="M 30,30 L 70,30 L 70,70 L 30,70 Z"
      fill="#8B8B8B"
      opacity="0.7"
      data-surface="O"
    />
    
    <!-- Z-index: 4 - Carie (mai sus) -->
    <path 
      d="M 10,20 L 30,30 L 30,70 L 10,80 Z"
      fill="#8B4513"
      opacity="0.8"
      data-surface="M"
    />
    
    <!-- Z-index: 5 - Fractură (cel mai sus) -->
    <path 
      d="M 70,30 L 90,20 L 90,80 L 70,70 Z"
      fill="none"
      stroke="#FF4444"
      stroke-width="3"
      opacity="0.9"
      data-surface="D"
    />
  </svg>
</div>
```

### Rezultat:
```
     Tooth 46 - Multiple probleme
     
        ┌─────┐
      ┌─┼─────┼─┐
    ███░░░░░░░////  
    ███░░░░░░░////  ← Maro=carie, Gri=amalgam, Roșu=fractură
    ███░░░░░░░////
      └─┼─────┼─┘
        └─────┘
```

---

## Implementare în React

```jsx
// ToothRenderer.jsx
import React from 'react';

const ToothRenderer = ({ toothNumber, view, conditions, interactive, onSurfaceClick }) => {
  const imagePath = `/assets/teeth/iso${toothNumber}-${view}.png`;
  const shouldMirror = [2, 3].includes(Math.floor(toothNumber / 10));
  
  return (
    <div 
      className="tooth-container"
      style={{
        position: 'relative',
        width: '100px',
        height: view === 'frontal' ? '150px' : '100px',
        transform: shouldMirror ? 'scaleX(-1)' : 'none'
      }}
    >
      {/* Base PNG image */}
      <img 
        src={imagePath}
        alt={`Tooth ${toothNumber}`}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />
      
      {/* SVG Overlay */}
      <svg
        viewBox={view === 'frontal' ? '0 0 100 150' : '0 0 100 100'}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      >
        {conditions.map((condition, index) => {
          const path = getSurfacePath(view, condition.surface);
          
          return (
            <path
              key={index}
              d={path}
              fill={condition.type === 'fracture' ? 'none' : condition.color}
              opacity={condition.opacity}
              stroke={condition.stroke || 'none'}
              strokeWidth={condition.strokeWidth || 1}
              data-surface={condition.surface}
              data-type={condition.type}
              onClick={() => interactive && onSurfaceClick?.(condition.surface)}
              style={{
                cursor: interactive ? 'pointer' : 'default',
                transition: 'fill 0.2s'
              }}
              onMouseEnter={(e) => {
                if (interactive) {
                  e.target.style.opacity = '0.9';
                }
              }}
              onMouseLeave={(e) => {
                if (interactive) {
                  e.target.style.opacity = condition.opacity;
                }
              }}
            />
          );
        })}
      </svg>
    </div>
  );
};

// Helper pentru a obține SVG path pentru fiecare suprafață
const getSurfacePath = (view, surface) => {
  const paths = {
    topview: {
      O: 'M 30,30 L 70,30 L 70,70 L 30,70 Z',
      M: 'M 10,20 L 30,30 L 30,70 L 10,80 Z',
      D: 'M 70,30 L 90,20 L 90,80 L 70,70 Z',
      B: 'M 30,10 L 70,10 L 70,30 L 30,30 Z',
      L: 'M 30,70 L 70,70 L 70,90 L 30,90 Z'
    },
    frontal: {
      B: 'M 10,30 L 90,30 L 90,120 L 10,120 Z',
      M: 'M 0,30 L 10,30 L 10,120 L 0,120 Z',
      D: 'M 90,30 L 100,30 L 100,120 L 90,120 Z'
    },
    lingual: {
      L: 'M 10,30 L 90,30 L 90,120 L 10,120 Z',
      M: 'M 0,30 L 10,30 L 10,120 L 0,120 Z',
      D: 'M 90,30 L 100,30 L 100,120 L 90,120 Z'
    }
  };
  
  return paths[view]?.[surface] || '';
};

export default ToothRenderer;
```

---

## CSS pentru Stilizare

```css
/* Base container */
.tooth-container {
  position: relative;
  display: inline-block;
}

/* Restaurări */
.restoration-amalgam {
  fill: #8B8B8B;
  opacity: 0.7;
  stroke: #6B6B6B;
  stroke-width: 1px;
}

.restoration-composite {
  fill: #E8E8E8;
  opacity: 0.6;
  stroke: #C8C8C8;
  stroke-width: 1px;
}

.restoration-crown {
  fill: #9575CD;
  opacity: 0.5;
  stroke: #7557AD;
  stroke-width: 2px;
}

/* Patologii */
.pathology-caries {
  fill: #8B4513;
  opacity: 0.8;
  stroke: #5B2813;
  stroke-width: 1px;
}

.pathology-fracture {
  fill: none;
  stroke: #FF4444;
  stroke-width: 3px;
  stroke-dasharray: 5, 3;
  opacity: 0.9;
}

.pathology-discoloration {
  fill: #9575CD;
  opacity: 0.4;
}

/* Interactive surfaces */
.surface-selectable {
  fill: transparent;
  stroke: #E0E0E0;
  stroke-width: 1;
  cursor: pointer;
  transition: fill 0.2s;
}

.surface-selectable:hover {
  fill: rgba(0, 163, 224, 0.3);
}

.surface-selectable.selected {
  fill: rgba(0, 163, 224, 0.5);
  stroke: #00A3E0;
  stroke-width: 2;
}
```

---

## Legendă Culori

| Tip | Culoare | Hex | Opacitate |
|-----|---------|-----|-----------|
| **Restaurări** |
| Amalgam | Gri închis | #8B8B8B | 0.7 |
| Composite | Alb-gri | #E8E8E8 | 0.6 |
| Coroană | Mov | #9575CD | 0.5 |
| Aur | Auriu | #FFD700 | 0.7 |
| **Patologii** |
| Carie | Maro | #8B4513 | 0.8 |
| Fractură | Roșu | #FF4444 | 0.7 |
| Decolorare | Mov | #9575CD | 0.4 |
| Abces | Roșu aprins | #FF6B6B | 0.8 |

---

Acest sistem oferă:
✅ Control precis al suprafețelor
✅ Culori dinamice și personalizabile
✅ Performanță excelentă
✅ Interactivitate completă
✅ Posibilitate de multiple condiții pe același dinte

