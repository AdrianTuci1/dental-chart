/**
 * Calculates the suggested Pulpal Diagnosis based on endodontic test results.
 * 
 * @param {Object} tests - Object containing test results, e.g., { Cold: { result: 'Positive', detail: 'Lingering' } }
 * @returns {String|null} - Suggested diagnosis or null if insufficient data
 */
export const suggestPulpalDiagnosis = (tests) => {
    if (!tests) return null;

    const cold = tests['Cold'];
    const heat = tests['Heat'];
    const electric = tests['Electricity'];

    // If no vitality tests are recorded, we can't diagnose pulp
    if (!cold && !heat && !electric) return null;

    // NECROSIS
    // Negative response to cold is key indicator for necrosis (if tooth is mature)
    // We assume 'Negative' means no response.
    if (cold?.result === 'Negative' && (!heat || heat.result === 'Negative') && (!electric || electric.result === 'Negative')) {
        return 'Pulp Necrosis';
    }

    // SYMPTOMATIC IRREVERSIBLE PULPITIS
    // Key: Lingering pain after cold/heat
    if (
        (cold?.detail === 'Pain lingering' || cold?.detail === 'Unpleasant') ||
        (heat?.detail === 'Pain lingering' || heat?.detail === 'Unpleasant')
    ) {
        return 'Symptomatic Irreversible Pulpitis';
    }

    // REVERSIBLE PULPITIS
    // Key: Pain/Positive but NOT lingering (Pain stimulus only)
    if (
        (cold?.detail === 'Pain stimulus') ||
        (heat?.detail === 'Pain stimulus')
    ) {
        return 'Reversible Pulpitis';
    }

    // NORMAL PULP
    // Key: Positive response within limits
    if (
        (cold?.detail === 'Within limits' || cold?.result === 'Positive') &&
        (heat?.detail === 'Within limits' || !heat)
    ) {
        return 'Normal Pulp';
    }

    return null;
};
