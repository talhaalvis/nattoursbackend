const { response } = require('../App');
const User = require('./../models/UserModal');
const { resetPassword } = require('./AuthController');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json({ status: 'success', users });
  } catch (err) {
    response.status(500).json({ message: err });
  }
  next();
};

exports.updateMe = async (req, res, next) => {
  try {
    // 1) create error if user post password data
    if (req.body.password || req.body.passwordConfirm) {
      res.status(400).json({
        status: 'fail',
        message:
          'this route is not for password change! if you want to change your password please use updateMyPassword rout',
      });
    }
    // 2) update user Document
    const filteredBody = filterObj(req.body, 'name', 'email');

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (e) {
    res.status(500).json({
      status: 'fail',
      message: e,
    });
  }
};
// delete user
exports.deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user.id, { active: false });
    res.status(204).json({
      status: 'success',
      data: null,
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
