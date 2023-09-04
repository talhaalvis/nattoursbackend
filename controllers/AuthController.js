const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('./../models/UserModal');
const sendEmail = require('./../Utils/Email');
const { response } = require('../App');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangeAt: req.body.passwordChangeAt,
      role: req.body.role,
    });
    createSendToken(newUser, 201, res);
    // const token = signToken(newUser._id);
    // res.status(201).json({
    //   status: 'success',
    //   token,
    //   data: {
    //     user: newUser,
    //   },
    // });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err,
    });
  }
  next();
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // -1) check email and password is exists
    if (!email || !password) {
      res
        .status(400)
        .json({ status: 'Fail', message: 'please provide email and password' });
      next();
    }
    // -2) check email exists and password is correct
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
      res.status(401).json({
        status: 'fail',
        message: 'Incrorrect email and password',
      });
      next();
    } else {
      // -3) if everything is ok then send token to client
      createSendToken(user, 200, res);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: 'error',
      message: err,
    });
  }
};

exports.protect = async (req, res, next) => {
  let token;
  try {
    // -1) check token if it exists
    if (req.headers && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      res
        .status(401)
        .json({ status: 'Not Found', message: 'Token not found please login' });
    }
    // -2) verification Token
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    // -3)check if user still exists
    const freshUser = await User.findById(decoded.id);

    if (!freshUser) {
      res.status(401).json({
        status: 'fail',
        message: 'the user blonging  to this token does no longer exist ',
      });
    }

    // 4) check if the user changed their password after token has issued
    if (freshUser.changePasswordAfter(decoded.iat)) {
      res.status(401).json({
        status: 'fail',
        message: 'user changed Recently password!',
      });
    }

    // 5) Grant access to the Protect route
    req.user = freshUser;
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err,
    });
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        status: 'fail',
        message: 'you are not allowed to perform this action',
      });
    }
    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  // 1) get user based on Posted email
  try {
    const user = await User.findOne({
      email: req.body.email,
    });
    if (!user) {
      res.status(404).json({
        status: 'fail',
        message: 'There is no user with that email',
      });
    }
    // 2) Generate the randome token for reset

    const resetToken = user.createPasswordChangeToken();
    await user.save({ validateBeforeSave: false });

    // 3) send to the mail
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `forgot your password ? submit a patch request with your Newpassword and confirmPassword to: ${resetUrl} .\n if you did not forgot password please ignore this email `;

    await sendEmail({
      email: user.email,
      subject: 'your password reset token (valid for 10min)',
      message: message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to Email!',
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      status: 'fail',
      message: e,
    });
  }
  next();
};
exports.resetPassword = async (req, res, next) => {
  try {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        $gt: Date.now(),
      },
    });

    // -2) if token has not expired,and there is user,and set password
    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Token is invalid or expired',
      });
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3)
    // 4)
    createSendToken(user, 201, res);
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    // 1) get user from collection

    const user = await User.findById(req.user.id).select('+password');

    // 2) check if posted correct password
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      res.status(401).json({
        status: 'fail',
        message: 'your current password is incorrect',
      });
    }
    // 3) if so password update
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // 4 send token to client

    createSendToken(user, 201, res);
  } catch (e) {
    res.status(500).json({
      status: 'fail',
      message: e,
    });
  }
};
