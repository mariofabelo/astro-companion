export type Source = "arXiv" | "ads";

export type Paper = {
  id: string;              // e.g., "arxiv:2401.12345"
  source: Source;
  title: string;
  authors: string[];
  abstract?: string;
  summary?: string;        // AI-generated summary of the abstract
  year?: number;
  categories?: string[];
  url_html: string;
  url_pdf?: string;
  doi?: string;
  citation_count?: number;
  citations?: number;
  publishedDate?: string;
  journal?: string;
  arxivId?: string;        // Internal field for citation lookup
};

export type SearchRequest = {
  query: string;
  maxResults: 2 | 3 | 5 | 10;
  sources: Source[];
};

export type SearchResponse = {
  papers: Paper[];
};
