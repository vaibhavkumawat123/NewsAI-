import express from 'express';
import {
  fetchAllNews,
  fetchNewsByCategory,
  Preferences,
} from '../controllers/newsController.js';

const newRoutes = express.Router();

newRoutes.get('/news', fetchAllNews);
newRoutes.get('/news/:category', fetchNewsByCategory);
newRoutes.post('/preferences/:id', Preferences);

export default newRoutes;
