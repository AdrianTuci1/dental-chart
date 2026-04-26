const express = require('express');
const medicController = require('../../controllers/medicController');
const clinicController = require('../../controllers/clinicController');
const { requireAuth, requireSameMedicParam } = require('../../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.post('/', medicController.createMedic);
router.get('/:id', requireSameMedicParam('id'), medicController.getMedic);
router.put('/:id', requireSameMedicParam('id'), medicController.updateMedic);
router.get('/:id/patients', requireSameMedicParam('id'), medicController.getMedicPatients);
router.get('/:id/clinics', requireSameMedicParam('id'), clinicController.listMedicClinics);
router.post('/:id/seed', requireSameMedicParam('id'), medicController.seedMedicData);
router.post('/:id/api-key/rotate', requireSameMedicParam('id'), medicController.rotateApiKey);
router.delete('/:id', requireSameMedicParam('id'), medicController.deleteMedic);

module.exports = router;
