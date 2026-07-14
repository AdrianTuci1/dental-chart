const fs = require('fs');
const path = require('path');

const IMAGE_PATH = path.join(__dirname, '../public/chart2.png');
const DETECTIONS_PATH = path.join(__dirname, '../public/detections.json');
const OUTPUT_PATH = path.join(__dirname, '../dist/preview-standalone.html');

const imageBase64 = fs.readFileSync(IMAGE_PATH).toString('base64');
const detections = JSON.parse(fs.readFileSync(DETECTIONS_PATH, 'utf8'));

function getPngDimensions(buffer) {
  if (buffer.length < 24) return null;
  if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4E || buffer[3] !== 0x47) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const { width: imgWidth, height: imgHeight } = getPngDimensions(fs.readFileSync(IMAGE_PATH)) || { width: 0, height: 0 };

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dental Scan Detection Preview</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        h1 { margin: 0 0 12px; font-size: 1.25rem; }
        .meta { color: #94a3b8; font-size: 0.875rem; margin-bottom: 16px; }
        .preview-container {
            position: relative;
            width: 100%;
            max-width: ${imgWidth || '0'}px;
            aspect-ratio: ${imgWidth || '0'} / ${imgHeight || '0'};
            border: 1px solid #334155;
            border-radius: 8px;
            overflow: hidden;
            background: #020617;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .preview-container img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .overlay {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        .legend {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 16px;
            justify-content: center;
        }
        .legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; }
        .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
        .status { margin-top: 12px; font-size: 0.9rem; color: #cbd5e1; }
    </style>
</head>
<body>
    <h1>Detection Preview</h1>
    <div class="meta" id="meta">Loading...</div>
    <div class="preview-container" id="container">
        <img id="scan" src="data:image/png;base64,${imageBase64}" alt="Dental scan" />
        <svg id="overlay" class="overlay" viewBox="0 0 ${imgWidth || '0'} ${imgHeight || '0'}" preserveAspectRatio="xMidYMid meet"></svg>
    </div>
    <div class="status" id="status"></div>
    <div class="legend" id="legend"></div>

    <script>
        const detections = ${JSON.stringify(detections)};

        const ORIGINAL_WIDTH = 2041;
        const ORIGINAL_HEIGHT = 1024;

        function normalizePoint(p, imgWidth, imgHeight) {
            return [
                p[0] * imgWidth / ORIGINAL_WIDTH,
                p[1] * imgHeight / ORIGINAL_HEIGHT
            ];
        }

        const labelColors = {
            'Filling': '#4DEEEA',
            'Fillings': '#4DEEEA',
            'Tooth with fillings': '#4DEEEA',
            'Caries': '#FF3D00',
            'Cavity': '#FF3D00',
            'Tooth with caries': '#FF3D00',
            'Crown': '#FFD700',
            'Tooth with crown': '#FFD700',
            'Implant': '#7449FF',
            'Missing teeth': '#94A3B8',
            'Residual root': '#94A3B8',
            'Root Canal Treatment': '#FF8A00',
            'Root-canal filling': '#FF8A00',
            'Tooth with RCT': '#FF8A00',
            'Root-canal + Crown': '#FF8A00',
            'impacted tooth': '#E8175D',
            'Root Piece': '#363636',
            'Tooth without anomalies': '#4ADE80',
            'Detection': '#4ADE80'
        };

        function getColor(label) {
            return labelColors[label] || labelColors['Detection'];
        }

        function smoothContourToPath(points, imgWidth, imgHeight) {
            if (!points || points.length < 3) return '';
            const len = points.length;
            const norm = p => normalizePoint(p, imgWidth, imgHeight);
            const mid = (a, b) => ({ x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 });
            const pts = points.map(norm);
            const start = mid(pts[len - 1], pts[0]);
            let d = 'M ' + start.x + ' ' + start.y;
            for (let i = 0; i < len; i++) {
                const curr = pts[i];
                const next = pts[(i + 1) % len];
                const m = mid(curr, next);
                d += ' Q ' + curr[0] + ' ' + curr[1] + ', ' + m.x + ' ' + m.y;
            }
            return d + ' Z';
        }

        function init() {
            const img = document.getElementById('scan');
            const container = document.getElementById('container');
            const overlay = document.getElementById('overlay');
            container.style.maxWidth = img.naturalWidth + 'px';
            container.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight;
            overlay.setAttribute('viewBox', '0 0 ' + img.naturalWidth + ' ' + img.naturalHeight);

            const teeth = detections.teeth || [];
            const nonNormal = teeth.filter(t => t.status && t.status.status_name !== 'Tooth without anomalies');

            document.getElementById('meta').textContent =
                img.naturalWidth + '×' + img.naturalHeight + ' px · ' + teeth.length + ' teeth detected · ' + nonNormal.length + ' anomalies shown';

            nonNormal.forEach((det) => {
                const color = getColor(det.status.status_name);
                const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', smoothContourToPath(det.contour, img.naturalWidth, img.naturalHeight));
                path.setAttribute('fill', color);
                path.setAttribute('fill-opacity', '0.4');
                path.setAttribute('stroke', color);
                path.setAttribute('stroke-width', '2');
                path.setAttribute('stroke-linejoin', 'round');
                g.appendChild(path);

                const bbox = [
                    normalizePoint([det.bbox[0], det.bbox[1]], img.naturalWidth, img.naturalHeight),
                    normalizePoint([det.bbox[2], det.bbox[3]], img.naturalWidth, img.naturalHeight)
                ];
                const cx = bbox[0][0] + (bbox[1][0] - bbox[0][0]) / 2;
                const cy = bbox[0][1] + (bbox[1][1] - bbox[0][1]) / 2;
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', cx);
                text.setAttribute('y', cy);
                text.setAttribute('fill', '#ffffff');
                text.setAttribute('font-size', '14');
                text.setAttribute('font-weight', 'bold');
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                text.setAttribute('paint-order', 'stroke');
                text.setAttribute('stroke', '#000000');
                text.setAttribute('stroke-width', '3');
                text.setAttribute('stroke-linecap', 'round');
                text.setAttribute('stroke-linejoin', 'round');
                text.textContent = det.fdi;
                g.appendChild(text);

                overlay.appendChild(g);
            });

            document.getElementById('status').textContent =
                'Showing ' + nonNormal.length + ' non-normal teeth (normal teeth are filtered)';

            const legend = document.getElementById('legend');
            const seen = new Set();
            nonNormal.forEach(t => {
                const label = t.status.status_name;
                if (seen.has(label)) return;
                seen.add(label);
                const item = document.createElement('div');
                item.className = 'legend-item';
                item.innerHTML = '<span class="legend-dot" style="background:' + getColor(label) + '"></span>' + label;
                legend.appendChild(item);
            });
        }

        document.getElementById('scan').onload = init;
    </script>
</body>
</html>
`;

fs.writeFileSync(OUTPUT_PATH, html);
console.log('Standalone preview generated at:', OUTPUT_PATH);
console.log('Open it directly in your browser (no server needed).');
