import User from '../model/User.js';
import axios from 'axios';
import News from '../model/News.js';

// Save user preferences
export const Preferences = async (req, res) => {
  try {
    const { id } = req.params;
    const { preferences } = req.body;

    const user = await User.findById(id);
    console.log(user);
    console.log(user.preferences);

    user.preferences = [...user.preferences, ...preferences];
    await user.save();

    res.status(200).json({
      message: 'Preferences saved successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Fetch news by category
export const fetchNewsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1 } = req.query;
    const pageSize = 10;

    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?category=${category}&language=en&pageSize=${pageSize}&page=${page}&apiKey=${process.env.NEWS_API_KEY}`
    );

    if (!response.data.articles.length) {
      return res.status(404).json({ message: 'No news found for this category.' });
    }

    res.status(200).json({
      news: response.data.articles,
      nextPage: response.data.articles.length === pageSize ? Number(page) + 1 : null,
    });

  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);

    // ✅ Handle API quota exceeded
    if (error.response?.data?.code === 'rateLimited') {
      return res.status(200).json({
        news: [
          {
            title: "⚠️ API quota exceeded",
            description: "Upgrade to paid plan or wait for reset.",
            url: "#",
            urlToImage: "https://via.placeholder.com/400x200",
            publishedAt: new Date().toISOString(),
            content: "This is dummy fallback news.",
          },
        ],
        nextPage: null,
      });
    }

    res.status(500).json({ message: 'Internal Server Error' });
  }
};