import User from "../model/User.js";
import axios from "axios";
import News from "../model/News.js";

export const Preferences = async (req, res) => {
  try {
    const { id } = req.params;
    const { preferences } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.preferences = [...user.preferences, ...preferences];
    await user.save();

    res.status(200).json({ message: "Preferences saved successfully" });
  } catch (error) {
    console.error("❌ Preferences Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const fetchNewsByCategory = async (req, res) => {
  const { category } = req.params;
  const { page = 1 } = req.query;
  const pageSize = 10;

  try {
    let url;

    // Use category only if not general
    if (category === "general") {
      url = `https://newsapi.org/v2/top-headlines?language=en&pageSize=${pageSize}&page=${page}&apiKey=${process.env.NEWS_API_KEY}`;
    } else {
      url = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&pageSize=${pageSize}&page=${page}&apiKey=${process.env.NEWS_API_KEY}`;
    }

    const response = await axios.get(url);

    const articles = response?.data?.articles || [];

    if (!articles.length) {
      return res
        .status(404)
        .json({ message: `No news found for category: ${category}` });
    }

    return res.status(200).json({
      news: articles,
      nextPage: articles.length === pageSize ? Number(page) + 1 : null,
    });
  } catch (error) {
    console.error("❌ News Fetch Error:", error.response?.data || error.message);

    // Quota error fallback
    if (error.response?.status === 429) {
      return res.status(200).json({
        news: [
          {
            title: "⚠️ API quota exceeded",
            description: "You’ve hit the free-tier NewsAPI limit.",
            url: "#",
            urlToImage: "https://via.placeholder.com/400x200",
            publishedAt: new Date().toISOString(),
            content: "Please try again later or upgrade the plan.",
          },
        ],
        nextPage: null,
      });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const fetchAllNews = async (req, res) => {
  try {
    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?language=en&pageSize=10&page=1&apiKey=${process.env.NEWS_API_KEY}`
    );

    res.status(200).json({
      news: response.data.articles,
    });
  } catch (error) {
    console.error("❌ All News Error:", error.message);
    res.status(500).json({
      message: error.message || "Failed to fetch all news",
    });
  }
};
