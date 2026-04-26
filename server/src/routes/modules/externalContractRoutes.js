const express = require('express');
const apiContractController = require('../../controllers/apiContractController');
const externalTelemetryController = require('../../controllers/externalTelemetryController');
const { requireAppSecret } = require('../../middleware/appSecretMiddleware');

const router = express.Router();

router.post('/patients', apiContractController.createOrUpdatePatient);
router.put('/patients/:id', apiContractController.updatePatient);
router.delete('/patients/:id', apiContractController.deletePatient);
router.get('/telemetry/events', requireAppSecret, externalTelemetryController.listProductEvents);

module.exports = router;
