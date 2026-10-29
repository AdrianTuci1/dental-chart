/**
 * Composition root.
 *
 * Every object graph is built here and nowhere else. Application services receive their
 * repositories and collaborators through constructors, which keeps the dependency
 * direction pointing inward and makes the HTTP adapters thin.
 */
const { loadConfig } = require('./config');
const { createDocumentClient } = require('./shared/infrastructure/documentClient');

const MedicRepository = require('./modules/identity/infrastructure/MedicRepository');
const RefreshTokenRepository = require('./modules/identity/infrastructure/RefreshTokenRepository');
const GoogleAuthService = require('./modules/identity/infrastructure/GoogleAuthService');
const { PasswordHasher } = require('./modules/identity/infrastructure/PasswordHasher');
const SessionService = require('./modules/identity/application/SessionService');
const MedicService = require('./modules/identity/application/MedicService');
const AuthService = require('./modules/identity/application/AuthService');

const ClinicRepository = require('./modules/clinic/infrastructure/ClinicRepository');
const ClinicService = require('./modules/clinic/application/ClinicService');

const PatientRepository = require('./modules/patients/infrastructure/PatientRepository');
const HistoryRepository = require('./modules/patients/infrastructure/HistoryRepository');
const TreatmentPlanRepository = require('./modules/patients/infrastructure/TreatmentPlanRepository');
const PatientService = require('./modules/patients/application/PatientService');
const PatientSeedService = require('./modules/patients/application/PatientSeedService');
const HistoryService = require('./modules/patients/application/HistoryService');
const TreatmentPlanService = require('./modules/patients/application/TreatmentPlanService');

const UserAnalyticsRepository = require('./modules/analytics/infrastructure/UserAnalyticsRepository');
const UserAnalyticsService = require('./modules/analytics/application/UserAnalyticsService');

const EmailService = require('./modules/email/application/EmailService');
const AIService = require('./modules/ai/application/AIService');
const ApiKeyAuthenticator = require('./modules/integration/application/ApiKeyAuthenticator');
const ConfigurationService = require('./modules/system/application/ConfigurationService');

const config = loadConfig();
const documentClient = createDocumentClient(config);
const tableName = config.database.tableName;

const repositoryOptions = { client: documentClient, tableName };

const medicRepository = new MedicRepository(repositoryOptions);
const clinicRepository = new ClinicRepository(repositoryOptions);
const patientRepository = new PatientRepository(repositoryOptions);
const historyRepository = new HistoryRepository(repositoryOptions);
const treatmentPlanRepository = new TreatmentPlanRepository(repositoryOptions);
const refreshTokenRepository = new RefreshTokenRepository(repositoryOptions);
const analyticsRepository = new UserAnalyticsRepository(repositoryOptions);

const emailService = new EmailService();
const analyticsService = new UserAnalyticsService({ repository: analyticsRepository });
const sessionService = new SessionService({ repository: refreshTokenRepository });
const passwordHasher = new PasswordHasher();
const googleAuthService = new GoogleAuthService();

let patientService;

const clinicService = new ClinicService({
    clinicRepository,
    medicRepository,
    emailService,
    analyticsService,
    patientDirectory: {
        deletePatientsByClinicId: (clinicId) => patientService.deletePatientsByClinicId(clinicId),
    },
});

patientService = new PatientService({
    patientRepository,
    historyRepository,
    treatmentPlanRepository,
    medicRepository,
    clinicService,
});

const historyService = new HistoryService({ historyRepository });
const treatmentPlanService = new TreatmentPlanService({ treatmentPlanRepository });
const patientSeedService = new PatientSeedService({
    patientService,
    historyService,
    treatmentPlanService,
});

const medicService = new MedicService({
    medicRepository,
    patientService,
    patientSeedService,
    clinicService,
    emailService,
    sessionService,
    analyticsService,
    passwordHasher,
});

const authService = new AuthService({
    medicService,
    sessionService,
    passwordHasher,
    googleAuthService,
    analyticsService,
});

const aiService = new AIService();
const apiKeyAuthenticator = new ApiKeyAuthenticator({ medicService });
const configurationService = new ConfigurationService({
    config,
    emailService,
    medicService,
});

module.exports = {
    config,
    documentClient,
    tableName,
    repositories: {
        medicRepository,
        clinicRepository,
        patientRepository,
        historyRepository,
        treatmentPlanRepository,
        refreshTokenRepository,
        analyticsRepository,
    },
    emailService,
    analyticsService,
    sessionService,
    passwordHasher,
    googleAuthService,
    clinicService,
    patientService,
    patientSeedService,
    historyService,
    treatmentPlanService,
    medicService,
    authService,
    aiService,
    apiKeyAuthenticator,
    configurationService,
};
