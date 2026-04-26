const express = require('express');
const aiController = require('../../controllers/aiController');

const router = express.Router();
const expressRaw = express.raw({ type: 'application/octet-stream', limit: '10mb' });

router.post('/analyze', expressRaw, aiController.analyzeXray);
router.get(/^\/assets\/(.+)$/, aiController.serveAsset);

module.exports = router;
