const express = require('express');

const morgan = require('morgan');
const app = express();
const tourRouter = require('./routes/TourRoutes');
const userRouter = require('./routes/UserRoutes');
app.use(morgan('dev'));
app.use(express.json());

app.use((req, res, next) => {
  console.log('hello to the middleWare');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// ____server____

module.exports = app;
