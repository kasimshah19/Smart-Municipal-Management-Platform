import { User } from '../models/User.js';

export const findUserByEmail = async (email, selectPassword = false) => {
  const query = User.findOne({ email: email.toLowerCase().trim() });
  if (selectPassword) {
    query.select('+password');
  }
  return await query;
};

export const findUserById = async (id) => {
  return await User.findById(id);
};

export const createUser = async (userData) => {
  const user = new User(userData);
  await user.save();
  return user;
};
