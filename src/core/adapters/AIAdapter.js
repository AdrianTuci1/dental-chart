/**
 * AIAdapter transforms raw detections from the AI pipeline 
 * into the domain format used by the UI.
 */
export const AIAdapter = {
    /**
     * Transforms and filters raw AI output.
     */
    toDomain: (rawDetections) => {
        if (!rawDetections || !Array.isArray(rawDetections)) return [];

        return rawDetections
            .map((det, index) => ({
                id: `det-${index}`,
                label: det.label,
                confidence: det.confidence,
                bbox: det.bbox,
                contour: det.contour,
                type: det.label
            }));
    }
};
