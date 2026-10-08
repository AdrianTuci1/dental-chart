/**
 * Every API route is declared once here and consumed by both hosts: the Express app
 * (local process, Lambda) and the Cloudflare Worker adapter. Order matters, the same
 * way it does in Express: literal paths are declared before ':param' ones.
 *
 * A path ending in '/*' captures the rest of the path and hands it to the controller
 * as req.params[0].
 */
const authController = require('../controllers/authController');
const analyticsController = require('../controllers/analyticsController');
const clinicController = require('../controllers/clinicController');
const medicController = require('../controllers/medicController');
const patientController = require('../controllers/patientController');
const historyController = require('../controllers/historyController');
const treatmentPlanController = require('../controllers/treatmentPlanController');
const apiContractController = require('../controllers/apiContractController');
const aiController = require('../controllers/aiController');
const { requireAuth, requireSameMedicParam } = require('../middleware/authMiddleware');
const { attachPatientContext } = require('../middleware/patientContextMiddleware');
const { createRateLimit } = require('../middleware/rateLimitMiddleware');
const { rateLimitConfig } = require('../config/rateLimit');

const publicAuthRateLimit = createRateLimit({
    ...rateLimitConfig.auth,
});

const group = (prefix, middleware, routes) => routes.map((route) => ({
    ...route,
    path: `${prefix}${route.path}`,
    middleware: [...middleware, ...(route.middleware || [])],
}));

const routes = [
    ...group('/auth', [], [
        { method: 'post', path: '/register', middleware: [publicAuthRateLimit], handler: authController.register },
        { method: 'post', path: '/login', middleware: [publicAuthRateLimit], handler: authController.login },
        { method: 'post', path: '/google', middleware: [publicAuthRateLimit], handler: authController.googleLogin },
        { method: 'post', path: '/forgot-password', middleware: [publicAuthRateLimit], handler: authController.forgotPassword },
        { method: 'post', path: '/reset-password', middleware: [publicAuthRateLimit], handler: authController.resetPassword },
        { method: 'post', path: '/refresh', middleware: [publicAuthRateLimit], handler: authController.refresh },
        { method: 'post', path: '/logout', handler: authController.logout },
        { method: 'get', path: '/me', middleware: [requireAuth], handler: authController.getMe },
        { method: 'post', path: '/change-password', middleware: [requireAuth], handler: authController.changePassword },
    ]),

    ...group('/analytics', [], [
        { method: 'post', path: '/navigation', handler: analyticsController.trackNavigation },
    ]),

    ...group('/clinics', [requireAuth], [
        { method: 'post', path: '/', handler: clinicController.createClinic },
        { method: 'get', path: '/invitations/pending', handler: clinicController.listPendingInvitations },
        { method: 'get', path: '/:id', handler: clinicController.getClinic },
        { method: 'put', path: '/:id', handler: clinicController.updateClinic },
        { method: 'get', path: '/:id/members', handler: clinicController.getClinicMembers },
        { method: 'post', path: '/:id/invitations', handler: clinicController.inviteMedic },
        { method: 'post', path: '/:id/invitations/:inviteId/accept', handler: clinicController.acceptInvitation },
        { method: 'delete', path: '/:id/members/:medicId', handler: clinicController.removeMember },
        { method: 'post', path: '/:id/ownership-transfer', handler: clinicController.transferOwnership },
        { method: 'delete', path: '/:id', handler: clinicController.deleteClinic },
    ]),

    ...group('/medics', [requireAuth], [
        { method: 'post', path: '/', handler: medicController.createMedic },
        { method: 'get', path: '/:id', middleware: [requireSameMedicParam('id')], handler: medicController.getMedic },
        { method: 'put', path: '/:id', middleware: [requireSameMedicParam('id')], handler: medicController.updateMedic },
        { method: 'get', path: '/:id/patients', middleware: [requireSameMedicParam('id')], handler: medicController.getMedicPatients },
        { method: 'get', path: '/:id/clinics', middleware: [requireSameMedicParam('id')], handler: clinicController.listMedicClinics },
        { method: 'post', path: '/:id/seed', middleware: [requireSameMedicParam('id')], handler: medicController.seedMedicData },
        { method: 'post', path: '/:id/api-key/rotate', middleware: [requireSameMedicParam('id')], handler: medicController.rotateApiKey },
        { method: 'delete', path: '/:id', middleware: [requireSameMedicParam('id')], handler: medicController.deleteMedic },
    ]),

    ...group('/patients', [requireAuth], [
        { method: 'post', path: '/', handler: patientController.createPatient },
        { method: 'get', path: '/:id', handler: patientController.getPatient },
        { method: 'get', path: '/:id/chart', handler: patientController.getPatientChart },
        { method: 'delete', path: '/:id', middleware: [attachPatientContext], handler: patientController.deletePatient },
        { method: 'put', path: '/:id', handler: patientController.updatePatient },
        { method: 'post', path: '/:patientId/history', middleware: [attachPatientContext], handler: historyController.addHistoryRecord },
        { method: 'get', path: '/:patientId/history', handler: historyController.getPatientHistory },
        { method: 'post', path: '/:patientId/treatment-plans', middleware: [attachPatientContext], handler: treatmentPlanController.addTreatmentPlanItem },
        { method: 'get', path: '/:patientId/treatment-plans', handler: treatmentPlanController.getPatientTreatmentPlans },
    ]),

    ...group('/ai', [], [
        { method: 'post', path: '/analyze', rawBody: true, handler: aiController.analyzeXray },
        { method: 'get', path: '/assets/*', handler: aiController.serveAsset },
    ]),

    ...group('/external', [], [
        { method: 'post', path: '/patients', handler: apiContractController.createOrUpdatePatient },
        { method: 'put', path: '/patients/:id', handler: apiContractController.updatePatient },
        { method: 'delete', path: '/patients/:id', handler: apiContractController.deletePatient },
    ]),
];

const escapeForRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Express routes here are mounted under this prefix. The Worker matches against the same
 * value, so a path is either an API path on both hosts or on neither.
 */
const API_PREFIX = '/api';

/**
 * Express cannot take a '/*' path, so a trailing wildcard becomes a capture group.
 * The captured rest arrives in req.params[0], matching the Worker adapter.
 */
const expressPatternFor = (routePath) => {
    if (!routePath.endsWith('/*')) {
        return routePath;
    }

    return new RegExp(`^${escapeForRegExp(routePath.slice(0, -1))}(.+)$`);
};

module.exports = {
    routes,
    API_PREFIX,
    expressPatternFor,
};
