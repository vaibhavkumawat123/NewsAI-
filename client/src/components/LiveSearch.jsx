import React, { useEffect, useState, useRef } from 'react';
import { Loader, TextInput } from '@mantine/core';
import axios from 'axios';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

function LiveSearch() {
  const searchRef = useRef();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdown, setDropdown] = useState(false);

  useEffect(() => {
    const handleOutSideClick = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setDropdown(false);
      }
    };
    window.addEventListener('click', handleOutSideClick);
    return () => window.removeEventListener('click', handleOutSideClick);
  }, []);

  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([]);
      setDropdown(false);
      return;
    }

    const fetchData = async () => {
      setDropdown(true);
      setLoading(true);
      try {
        const res = await axios.get(
          `https://newsapi.org/v2/everything?q=${query}&apiKey=22a516dc80574660bf6a75c3192b2a09`
        );
        setResults(res.data.articles);
      } catch (error) {
        console.error('Search API error:', error);
      }
      setLoading(false);
    };

    const timeout = setTimeout(fetchData, 500);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full"
      ref={searchRef}
    >
      <TextInput
        radius="md"
        size="xs"
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search"
        leftSection={<Search size={16} />}
        className="w-full"
        value={query}
      />

      {dropdown && (
        <div className="absolute z-50 mt-1 max-h-[300px] overflow-y-auto bg-white w-full shadow rounded-sm border">
          {loading ? (
            <div className="flex px-4 py-8 justify-center items-center gap-4">
              <Loader size={20} />
              <p>Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col gap-2">
              {results.map((article, idx) => (
                <a
                  key={idx}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded"
                >
                  <img
                    className="h-12 w-12 rounded object-cover"
                    src={article.urlToImage || 'https://placehold.co/48x48'}
                    alt="thumbnail"
                  />
                  <p className="text-sm">{article.title}</p>
                </a>
              ))}
            </div>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-gray-500">
              No results found
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default LiveSearch;
