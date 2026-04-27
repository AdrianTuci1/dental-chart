const express = require('express');
const apiContractController = require('../../controllers/apiContractController');
const router = express.Router();

router.post('/patients', apiContractController.createOrUpdatePatient);
router.put('/patients/:id', apiContractController.updatePatient);
router.delete('/patients/:id', apiContractController.deletePatient);

module.exports = router;
