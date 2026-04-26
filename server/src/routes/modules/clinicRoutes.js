const express = require('express');
const clinicController = require('../../controllers/clinicController');
const { requireAuth } = require('../../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.post('/', clinicController.createClinic);
router.get('/invitations/pending', clinicController.listPendingInvitations);
router.get('/:id', clinicController.getClinic);
router.put('/:id', clinicController.updateClinic);
router.get('/:id/members', clinicController.getClinicMembers);
router.post('/:id/invitations', clinicController.inviteMedic);
router.post('/:id/invitations/:inviteId/accept', clinicController.acceptInvitation);
router.delete('/:id/members/:medicId', clinicController.removeMember);
router.post('/:id/ownership-transfer', clinicController.transferOwnership);
router.delete('/:id', clinicController.deleteClinic);

module.exports = router;
