import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface ResultDisplayProps {
  content: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ content }) => {
  return (
    <div className="prose prose-blue max-w-none prose-p:my-2 prose-headings:my-4 markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table {...props} className="min-w-full divide-y divide-gray-200 border" />
            </div>
          ),
          p: ({ node, children, ...props }) => {
             // Basic heuristic to detect if paragraph is a single math block to center it (optional)
             return <p {...props} className="leading-relaxed text-gray-800">{children}</p>
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default ResultDisplay;
