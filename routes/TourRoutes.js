const express = require('express');
const tourController = require('./../controllers/TourControllers');
const tourRouter = express.Router();
const authController = require('./../controllers/AuthController');
// tourRouter.param('id', tourController.checkId);

tourRouter.route('/tour-stats').get(tourController.getTourStat);
tourRouter.route('/monthly-plans/:year').get(tourController.getMonthlyPlan);
tourRouter
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);
tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead_guide'),
    tourController.deleteTour
  );

module.exports = tourRouter;
