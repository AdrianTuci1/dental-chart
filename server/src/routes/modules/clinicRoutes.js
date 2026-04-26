const express = require('express');
const clinicController = require('../../controllers/clinicController');
const { requireAuth } = require('../../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.post('/', clinicController.createClinic);
router.get('/:id', clinicController.getClinic);
router.get('/:id/members', clinicController.getClinicMembers);
router.post('/:id/invitations', clinicController.inviteMedic);
router.post('/:id/invitations/:inviteId/accept', clinicController.acceptInvitation);
router.post('/:id/ownership-transfer', clinicController.transferOwnership);

module.exports = router;
