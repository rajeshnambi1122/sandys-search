import React, { useState } from 'react';
import axios from 'axios';
import { Search, FileText, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PDFViewer from './PDFViewer';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setHasSearched(true);

    try {
      const response = await axios.post('http://localhost:5002/api/search', { query });
      setResults(response.data.results);
    } catch (err) {
      console.error(err);
      setError('Failed to search files. Please try again.' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen  flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-3xl space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold font-outfit sm:text-5xl text-[#ea550c]">
            Invoice Search
          </h1>

          <p className="text-lg font-outfit text-slate-600">
            Instantly find text inside your invoices.
          </p>
        </div>

        {/* Search Bar */}
        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          onSubmit={handleSearch}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#ea550c] to-[#fb923c] rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-white rounded-2xl shadow-xl p-2">
            <div className="pl-4 text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <input
              type="text"
              className="flex-1 block w-full border-0 bg-transparent py-4 pl-4 pr-4 text-slate-900 placeholder:text-slate-400 focus:ring-0 outline-none sm:text-lg sm:leading-6"
              placeholder="Enter text to search (e.g., 'Invoice #123')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-[#ea550c] px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#fb923c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fb923c] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
            </button>
          </div>
        </motion.form>

        {/* Results Area */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-center gap-3 text-red-700"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            {!loading && hasSearched && results.length === 0 && !error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center py-12"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No matches found</h3>
                <p className="mt-1 text-slate-500">Try adjusting your search terms.</p>
              </motion.div>
            )}

            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-4"
              >
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Found {results.length} result{results.length !== 1 && 's'}
                  </h2>
                </div>
                {results.map((result, index) => (
                  <motion.div
                    key={result.path}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      const normalizedPath = result.path.replace(/\\/g, '/');
                      const urlPath = normalizedPath.split('/').map(encodeURIComponent).join('/');
                      setSelectedFile(`http://localhost:5002/files/${urlPath}`);
                    }}
                    className="group relative bg-white rounded-xl p-4 shadow-sm ring-1 ring-slate-900/5 hover:shadow-md hover:ring-[#fb923c]/30 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 p-3 rounded-lg bg-[#fff] text-[#ea550c] group-hover:bg-[#fb923c] transition-colors">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-slate-900 truncate">
                          {result.path}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-slate-500">
                            Found in /{result.path.split('/')[0]}
                          </p>
                          <span className="text-xs text-slate-400">
                            {new Date(result.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="self-center">
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Match
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>


      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <PDFViewer
              fileUrl={selectedFile}
              query={query}
              onClose={() => setSelectedFile(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
