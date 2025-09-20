import { generatePaperFilename } from '../download';
import { Paper } from '@/types/paper';

describe('Download functionality', () => {
  describe('generatePaperFilename', () => {
    it('should generate a valid filename for arXiv papers', () => {
      const paper: Paper = {
        id: 'arxiv:2401.12345',
        source: 'arXiv',
        title: 'A Study of Quantum Computing Applications',
        authors: ['John Doe', 'Jane Smith'],
        abstract: 'This paper explores...',
        year: 2024,
        url_html: 'https://arxiv.org/abs/2401.12345',
        url_pdf: 'https://arxiv.org/pdf/2401.12345.pdf'
      };

      const filename = generatePaperFilename(paper);
      expect(filename).toBe('A_Study_of_Quantum_Computing_Applications_arxiv_2024.pdf');
    });

    it('should generate a valid filename for ADS papers', () => {
      const paper: Paper = {
        id: 'ads:2024ApJ...123..456D',
        source: 'ads',
        title: 'Galaxy Formation in the Early Universe',
        authors: ['Alice Johnson', 'Bob Wilson'],
        abstract: 'We investigate...',
        year: 2024,
        url_html: 'https://ui.adsabs.harvard.edu/abs/2024ApJ...123..456D',
        url_pdf: 'https://ui.adsabs.harvard.edu/abs/2024ApJ...123..456D/exportcitation'
      };

      const filename = generatePaperFilename(paper);
      expect(filename).toBe('Galaxy_Formation_in_the_Early_Universe_ads_2024.pdf');
    });

    it('should handle papers with special characters in title', () => {
      const paper: Paper = {
        id: 'arxiv:2401.12345',
        source: 'arXiv',
        title: 'Machine Learning & AI: A Comprehensive Study (2024)',
        authors: ['John Doe'],
        abstract: 'This paper...',
        year: 2024,
        url_html: 'https://arxiv.org/abs/2401.12345',
        url_pdf: 'https://arxiv.org/pdf/2401.12345.pdf'
      };

      const filename = generatePaperFilename(paper);
      expect(filename).toBe('Machine_Learning_AI_A_Comprehensive_Study_2024_arxiv_2024.pdf');
    });

    it('should handle papers without year', () => {
      const paper: Paper = {
        id: 'arxiv:2401.12345',
        source: 'arXiv',
        title: 'Test Paper',
        authors: ['John Doe'],
        abstract: 'This paper...',
        url_html: 'https://arxiv.org/abs/2401.12345',
        url_pdf: 'https://arxiv.org/pdf/2401.12345.pdf'
      };

      const filename = generatePaperFilename(paper);
      expect(filename).toBe('Test_Paper_arxiv_unknown.pdf');
    });

    it('should limit filename length', () => {
      const paper: Paper = {
        id: 'arxiv:2401.12345',
        source: 'arXiv',
        title: 'This is a very long paper title that should be truncated because it exceeds the maximum length limit for filenames',
        authors: ['John Doe'],
        abstract: 'This paper...',
        year: 2024,
        url_html: 'https://arxiv.org/abs/2401.12345',
        url_pdf: 'https://arxiv.org/pdf/2401.12345.pdf'
      };

      const filename = generatePaperFilename(paper);
      expect(filename.length).toBeLessThanOrEqual(60); // 50 chars + "_arxiv_2024.pdf"
      expect(filename).toMatch(/^This_is_a_very_long_paper_title_that_should_be_truncated_because_it_exceeds_the_maximum_length_limit_for_filenames_arxiv_2024\.pdf$/);
    });
  });
});
