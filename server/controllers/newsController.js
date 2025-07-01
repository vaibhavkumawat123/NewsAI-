import User from '../model/User.js';
import axios from 'axios';
import News from '../model/News.js';
export const Preferences = async (req, res) => {
  try {
    const { id } = req.params;
    const { preferences } = req.body;

    const user = await User.findById(id);
    console.log(user);
    // console.log([...preferences]);
    console.log(user.preferences);
    user.preferences = [...user.preferences, ...preferences];
    await user.save();

    res.status(200).json({
      message: 'preferences save successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const fetchNewsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const filter = { category: category.toLowerCase() };
    const total = await News.countDocuments(filter);

    const news = await News.find(filter)
      .sort({ publishedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const hasMore = page * pageSize < total;

    res.status(200).json({
      news,
      nextPage: hasMore ? page + 1 : null,
    });
  } catch (error) {
    console.error('❌ fetchNewsByCategory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
