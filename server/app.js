import express from "express";
import dotenv from "dotenv";
import dbConnect from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import cookieParser from "cookie-parser";
import newRoutes from "./routes/newRoutes.js";
import cors from "cors";
import axios from "axios";
import bookmarksRoutes from "./routes/bookmarksRoutes.js";
import readingHistoryRoutes from "./routes/readingHistoryRoutes.js";
import morgan from "morgan";
import aiRoutes from "./routes/aiRoutes.js";
import News from "./model/News.js";
import cron from "node-cron";
import mongoose from "mongoose";
import admin from "firebase-admin";

dotenv.config();

const app = express();

// Logging middleware
app.use(morgan("combined"));

// ✅ CORS: Only allow frontend domains
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://news-ai-delta-lime.vercel.app", // your Vercel frontend
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Core Middleware
app.use(cookieParser());
app.use(express.json());

// ✅ Firebase Admin Setup
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Connect to MongoDB
dbConnect();

// ✅ Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is alive ✅" });
});

// Home route
app.get("/", (req, res) => {
  res.send("HomePage");
});

// Route handlers
app.use("/auth", userRoutes);
app.use("/api", newRoutes);
app.use("/api", bookmarksRoutes);
app.use("/api", aiRoutes);
app.use("/api", readingHistoryRoutes);

// News Fetching (CRON + Axios + MongoDB)
const countries = ["us", "uk", "fr", "in", "it"];
const categories = [
  "health",
  "science",
  "sports",
  "entertainment",
  "politics",
  "business",
];

const fetchNewsAndStore = async () => {
  for (let country of countries) {
    for (let category of categories) {
      try {
        const { data } = await axios.get(
          `https://newsapi.org/v2/top-headlines?category=${category}&country=${country}&apiKey=${process.env.NEWS_API_KEY}`
        );

        if (data.articles?.length) {
          for (let article of data.articles) {
            const exist = await News.findOne({ title: article.title });

            if (!exist) {
              await News.create({
                content: article.content,
                title: article.title,
                author: article.author,
                description: article.description,
                url: article.url,
                urlToImage: article.urlToImage,
                category,
                publishedAt: article.publishedAt,
                country,
                source: {
                  id: article.source.id,
                  name: article.source.name,
                },
              });
              console.log(`Inserted: ${article.title} [${category}-${country}]`);
            } else {
              console.log(`Already exists: ${article.title}`);
            }
          }
        } else {
          console.log(`No articles for ${category}-${country}`);
        }
      } catch (err) {
        console.error(`Error fetching ${category}-${country}:`, err.message);
      }
    }
  }
};

// ⏰ Run every 15 minutes
cron.schedule("*/15 * * * *", fetchNewsAndStore);

// ✅ Server Start
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () =>
      console.log(`🚀 Server running: http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });