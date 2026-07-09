/**
 * AIAdapter transforms raw detections from the AI pipeline 
 * into the domain format used by the UI.
 */
export const AIAdapter = {
    /**
     * Transforms and filters raw AI output.
     * Supports both the old format (array with label/confidence) and the new
     * dual-model format (fdi + status.status_name).
     */
    toDomain: (rawDetections) => {
        if (!rawDetections) return [];

        const detections = Array.isArray(rawDetections) ? rawDetections : [];

        return detections
            .map((det, index) => {
                // New format: { fdi, confidence_fdi, bbox, contour, status: { status_id, status_name, confidence } }
                if (det && det.status) {
                    const statusName = det.status.status_name || 'unknown';
                    const category = getCategoryFromStatus(statusName);
                    const color = getColorFromStatus(statusName);
                    const displayType = getDisplayTypeFromStatus(statusName);
                    const toothNum = parseInt(det.fdi, 10);

                    return {
                        id: `det-${index}`,
                        tooth: isNaN(toothNum) ? null : toothNum,
                        fdi: det.fdi || null,
                        type: displayType,
                        label: statusName,
                        category,
                        color,
                        status: 'detected',
                        confidence: det.status.confidence ?? 0,
                        confidence_fdi: det.confidence_fdi ?? 0,
                        bbox: det.bbox || [],
                        contour: det.contour || []
                    };
                }

                // Old format: { label, confidence, bbox, contour }
                return {
                    id: `det-${index}`,
                    tooth: det.tooth ?? null,
                    fdi: det.tooth ? String(det.tooth) : null,
                    type: det.label || 'Detection',
                    label: det.label || 'Detection',
                    category: getCategoryFromStatus(det.label),
                    color: getColorFromStatus(det.label),
                    status: 'detected',
                    confidence: det.confidence ?? 0,
                    confidence_fdi: 0,
                    bbox: det.bbox || [],
                    contour: det.contour || []
                };
            })
            .filter(Boolean);
    }
};

function getCategoryFromStatus(statusName) {
    if (!statusName) return 'other';
    const lower = String(statusName).toLowerCase();
    if (lower.includes('caries') || lower.includes('residual root')) return 'pathology';
    if (lower.includes('filling') || lower.includes('crown') || lower.includes('rct')) return 'restoration';
    if (lower.includes('without anomalies')) return 'normal';
    return 'other';
}

function getColorFromStatus(statusName) {
    if (!statusName) return 'green';
    const lower = String(statusName).toLowerCase();
    if (lower.includes('caries')) return 'red';
    if (lower.includes('residual root')) return 'gray';
    if (lower.includes('implant')) return 'purple';
    if (lower.includes('filling')) return 'blue';
    if (lower.includes('rct')) return 'light-blue';
    if (lower.includes('crown')) return 'dark-blue';
    return 'green';
}

function getDisplayTypeFromStatus(statusName) {
    if (!statusName) return 'Unknown';
    const map = {
        'Tooth without anomalies': 'Normal',
        'Tooth with fillings': 'Filling',
        'Tooth with RCT': 'Root-canal filling',
        'Tooth with crown': 'Crown',
        'Tooth with caries': 'Caries',
        'Residual root': 'Residual root',
        'Tooth with RCT and crown': 'Root-canal + Crown'
    };
    return map[statusName] || statusName;
}
