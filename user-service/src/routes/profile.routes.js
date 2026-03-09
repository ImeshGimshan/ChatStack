
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const profileController = require('../controllers/profile.controller');

router.use(authenticateToken);

// Static routes must come before /:userId param route
router.get('/me', profileController.getMyProfile);
router.post('/me', profileController.createMyProfile);
router.put('/me', profileController.updateMyProfile);
router.get('/search', profileController.searchUsers);
router.get('/discover', profileController.discoverProfiles);

// Param route last
router.get('/:userId', profileController.getProfileByUserId);

module.exports = router;