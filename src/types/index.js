/**
 * @typedef {Object} Patient
 * @property {string} id
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} dateOfBirth - ISO date string
 * @property {'male' | 'female' | 'other'} gender
 * @property {string} email
 * @property {string} phone
 * @property {Object} address
 * @property {string} address.street
 * @property {string} address.city
 * @property {string} address.state
 * @property {string} address.zip
 * @property {string} address.country
 * @property {Object} medicalHistory
 * @property {string[]} medicalHistory.allergies
 * @property {string[]} medicalHistory.medications
 * @property {string[]} medicalHistory.conditions
 * @property {string} medicalHistory.notes
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 */

/**
 * @typedef {Object} Tooth
 * @property {number} toothNumber - ISO 3950
 * @property {'present' | 'missing' | 'extracted' | 'to-be-extracted' | 'implant' | 'deciduous'} status
 * @property {Object} surfaces
 * @property {Object} conditions
 * @property {boolean} conditions.hasImplant
 * @property {boolean} conditions.hasCrown
 * @property {boolean} conditions.hasBridge
 * @property {boolean} conditions.hasRootCanal
 * @property {boolean} conditions.hasCaries
 * @property {boolean} conditions.hasFracture
 * @property {Restoration[]} restorations
 * @property {ToothEndodontic} endodontic
 * @property {ToothPeriodontal} periodontal
 * @property {Pathology[]} pathology
 * @property {string} notes
 */

/**
 * @typedef {Object} Restoration
 * @property {string} id
 * @property {'filling' | 'crown' | 'bridge' | 'veneer' | 'inlay' | 'onlay' | 'implant'} type
 * @property {'amalgam' | 'composite' | 'ceramic' | 'gold' | 'porcelain' | 'zirconia'} material
 * @property {string[]} surfaces - e.g., ['O', 'M', 'D']
 * @property {string} color - hex color
 * @property {string} date - ISO date
 * @property {'planned' | 'in-progress' | 'completed'} status
 */

/**
 * @typedef {Object} ToothEndodontic
 * @property {boolean} hasRootCanal
 * @property {string} date - ISO date
 * @property {Object} tests
 * @property {'normal' | 'sensitive' | 'no-response'} tests.cold
 * @property {'normal' | 'sensitive' | 'no-response'} tests.heat
 * @property {'normal' | 'sensitive' | 'painful'} tests.percussion
 * @property {'normal' | 'sensitive' | 'painful'} tests.palpation
 * @property {number} tests.electricity
 */

/**
 * @typedef {Object} ToothPeriodontal
 * @property {Object} probingDepth
 * @property {number[]} probingDepth.distoPalatal
 * @property {number[]} probingDepth.palatal
 * @property {number[]} probingDepth.mesioPalatal
 * @property {number[]} probingDepth.distoBuccal
 * @property {number[]} probingDepth.buccal
 * @property {number[]} probingDepth.mesioBuccal
 * @property {Object} gingivalMargin
 * @property {boolean[]} bleeding - 6 sites
 * @property {boolean[]} plaque - 6 sites
 * @property {boolean[]} pus - 6 sites
 * @property {boolean[]} tartar - 6 sites
 * @property {'0' | '1' | '2' | '3'} mobility
 * @property {'0' | '1' | '2' | '3'} furcation
 */

/**
 * @typedef {Object} Pathology
 * @property {string} id
 * @property {'decay' | 'fracture' | 'tooth-wear' | 'discoloration' | 'apical' | 'development-disorder'} type
 * @property {string} subtype
 * @property {'mild' | 'moderate' | 'severe'} severity
 * @property {string[]} location
 * @property {string} date - ISO date
 * @property {string} notes
 */

/**
 * @typedef {Object} DentalChart
 * @property {string} id
 * @property {string} patientId
 * @property {string} date - ISO timestamp
 * @property {Object.<number, Tooth>} teeth
 * @property {string} globalNotes
 * @property {string} examiner
 */
