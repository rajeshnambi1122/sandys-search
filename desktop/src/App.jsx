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
  const [selectedPage, setSelectedPage] = useState(1);

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
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-outfit bg-[#f8fafc]">
      <div className="w-full max-w-4xl space-y-10">

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex flex-col items-center justify-center mb-6">
            <img
              src="./sandys-logo.png"
              alt="Sandy's Market Logo"
              className="w-16 h-16 mb-2 object-contain"
            />
            <h2 className="text-3xl font-bold text-dark">Sandy's Market</h2>
          </div>
          <div className="h-1 w-24 bg-secondary mx-auto rounded-full"></div>
          <h2 className="text-3xl font-bold text-dark">
            Invoice Search System
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Quickly locate specific text within your invoice archives.
          </p>
        </div>

        {/* Search Bar */}
        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          onSubmit={handleSearch}
          className="relative group max-w-2xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-white rounded-2xl shadow-xl p-2 border border-slate-100">
            <div className="pl-4 text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <input
              type="text"
              className="flex-1 block w-full border-0 bg-transparent py-4 pl-4 pr-4 text-slate-900 placeholder:text-slate-400 focus:ring-0 outline-none text-lg"
              placeholder="Search for invoice number, date, or item..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 uppercase tracking-wide"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SEARCH'}
            </button>
          </div>
        </motion.form>

        {/* Results Area */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-center gap-3 text-red-700 max-w-2xl mx-auto"
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 mb-4">
                  <Search className="w-8 h-8 text-primary" />
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
                <div className="flex items-center justify-between px-2 border-b border-slate-200 pb-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Search Results <span className="ml-2 text-sm font-normal text-slate-500">({results.length} found)</span>
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
                      setSelectedPage(result.matchPage || 1);
                    }}
                    className="group relative bg-white rounded-xl p-5 shadow-sm ring-1 ring-slate-900/5 hover:shadow-lg hover:ring-primary/30 transition-all duration-200 cursor-pointer border-l-4 border-transparent hover:border-primary"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 p-3 rounded-lg bg-orange-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        <FileText className="w-6 h-6" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-semibold text-slate-900 truncate group-hover:text-primary transition-colors">
                          {result.path}
                        </p>
                        {result.peep ? (
                          <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                            <img src={result.peep} alt="Search Match Preview" className="max-w-full h-auto object-contain" />
                          </div>
                        ) : result.snippet && (
                          <p className="mt-1 text-sm text-slate-600 font-mono bg-slate-50 p-2 rounded border border-slate-100 line-clamp-2">
                            <span dangerouslySetInnerHTML={{
                              __html: result.snippet.replace(new RegExp(`(${query})`, 'gi'), '<span class="bg-yellow-200 text-slate-900 font-bold">$1</span>')
                            }} />
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                            {result.path.split('/')[0] || 'Root'}
                          </span>
                          <span className="text-sm text-slate-500">
                            Modified: {new Date(result.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                          View
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
              initialPage={selectedPage}
              onClose={() => setSelectedFile(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}

export default App;
