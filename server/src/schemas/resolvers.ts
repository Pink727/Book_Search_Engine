import { AuthenticationError } from '@apollo/server/errors';
import User from '../models/User.js';
import { signToken } from '../services/auth.js';

const resolvers = {
  Query: {
    me: async (_parent: any, _args: any, context: any) => {
      if (context.user) {
        return User.findById(context.user._id);
      }
      throw new AuthenticationError('Not logged in');
    },
  },
  Mutation: {
    login: async (_parent: any, { email, password }: { email: string, password: string }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError("Can't find this user");
      }

      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new AuthenticationError('Wrong password!');
      }

      const token = signToken({ username: user.username, email: user.email, _id: user._id.toString() });
      return { token, user };
    },
    addUser: async (_parent: any, { username, email, password }: { username: string, email: string, password: string }) => {
      const user = await User.create({ username, email, password });
      const token = signToken({ username: user.username, email: user.email, _id: user._id.toString() });
      return { token, user };
    },
    saveBook: async (_parent: any, { bookData }: { bookData: any }, context: any) => {
      if (context.user) {
        return User.findByIdAndUpdate(
          context.user._id,
          { $addToSet: { savedBooks: bookData } },
          { new: true, runValidators: true }
        );
      }
      throw new AuthenticationError('Not logged in');
    },
    removeBook: async (_parent: any, { bookId }: { bookId: string }, context: any) => {
      if (context.user) {
        return User.findByIdAndUpdate(
          context.user._id,
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        );
      }
      throw new AuthenticationError('Not logged in');
    },
  },
};

export default resolvers;