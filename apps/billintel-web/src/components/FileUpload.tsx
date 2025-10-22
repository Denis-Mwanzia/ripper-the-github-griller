import React from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, AlertTriangle } from 'lucide-react';

interface FileUploadProps {
  file: File | null;
  error: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  file,
  error,
  onFileChange,
  onDrop,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card p-8"
    >
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Upload Your Billing Data
          </h2>
          <p className="text-gray-600">
            Get instant AI-powered insights from your billing files
          </p>
        </div>

        <div className="relative">
          <input
            id="billing-file"
            type="file"
            accept=".csv,.json"
            onChange={onFileChange}
            className="hidden"
            aria-label="Upload billing data file"
          />
          <motion.div
            className="border-2 border-dashed border-gray-300 rounded-3xl p-16 text-center hover:border-blue-400 transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 cursor-pointer focus-ring"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => document.getElementById('billing-file')?.click()}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => e.preventDefault()}
            onDragLeave={(e) => e.preventDefault()}
          >
            <motion.div
              className="space-y-6"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                <Upload className="w-10 h-10 text-blue-600" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold text-gray-900">
                  Drop your file here or click to browse
                </p>
                <p className="text-gray-500">
                  Supports CSV and JSON files up to 10MB
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {file && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-4 p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 shadow-lg"
          >
            <CheckCircle className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-800">{file.name}</p>
              <p className="text-sm text-emerald-600">Ready for analysis</p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-4 p-6 bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl border border-red-200 shadow-lg"
          >
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Upload Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
