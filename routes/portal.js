var express = require('express');
var router = express.Router();
var passport = require('passport');
const profile = require('../app/controller/profile');
const loan = require('../app/controller/loan');
const investment = require('../app/controller/investment');
const approval = require('../app/controller/approval');
const repayment = require('../app/controller/repayment');
const payment = require('../app/controller/payment');
const report = require('../app/controller/report');
const pricehistory = require('../app/controller/pricehistory');

router.get('/profile/list', profile.list);
router.post('/profile/filterlist', profile.filterlist);
router.post('/profile/isMobileExist', profile.isMobileExist);
router.post('/profile/create', profile.create);
router.post('/profile/update', profile.update);
router.delete('/profile/delete/:id', profile.delete);

router.post('/profile/login', profile.login);
router.post('/profile/loginwithotp', profile.loginwithotp);
router.post('/profile/search', profile.search);

router.get('/loan/list', loan.list);
router.post('/loan/filterlist', loan.filterlist);
router.get('/loan/pendinglist', loan.pendinglist);
router.post('/loan/create', loan.create);
router.post('/loan/update', loan.update);
router.delete('/loan/delete/:id', loan.delete);

router.get('/investment/list', investment.list);
router.post('/investment/create', investment.create);

router.get('/approval/list', approval.list);
router.get('/approval/pendinglist', approval.pendinglist);
router.post('/approval/update', approval.update);
router.post('/approval/filterlist', approval.filterlist);

router.get('/repayment/list', repayment.list);
router.post('/repayment/create', repayment.create);

router.post('/report/list', report.list);

router.get('/payment/list', payment.list);
router.post('/payment/create', payment.create);
router.post('/payment/update', payment.update);

router.get('/pricehistory/list', pricehistory.list);
router.post('/pricehistory/chart', pricehistory.chart);
router.post('/pricehistory/create', pricehistory.create);
router.post('/pricehistory/update', pricehistory.update);
router.delete('/pricehistory/delete/:id', pricehistory.delete);
module.exports = router;