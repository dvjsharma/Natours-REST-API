const { getTours, getParticulatTour, AddNewTour, UpdateTour, DeleteTour, aliasTopTours, getTourStats, getMonthlyPlan } = require('../Controllers/tourController.js');
// can add functions from middleware folder as well
const { protect, restrictTo } = require('../Controllers/authController.js')
const express = require('express');
const router = express.Router();

router.route('/top-5-cheap').get(aliasTopTours, getTours)
router.route('/tour-stats').get(getTourStats)
router.route('/monthly-plan/:year').get(getMonthlyPlan)

router.route('/').get(protect, getTours).post(AddNewTour)
router.route('/:id').get(getParticulatTour).patch(UpdateTour).delete(protect, restrictTo('admin' , 'lead-guide'), DeleteTour)

module.exports = router;
