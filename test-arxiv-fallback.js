// Simple test script to verify arXiv fallback functionality
// Run with: node test-arxiv-fallback.js

const testArxivFallback = async () => {
  try {
    console.log('🧪 Testing arXiv fallback API...');
    
    // Test with a known ADS bibcode that might have arXiv equivalent
    const testBibcode = '2023ApJ...951L..48B'; // Example bibcode
    
    const response = await fetch('http://localhost:3002/api/ads/arxiv-fallback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bibcode: testBibcode }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('🎉 arXiv fallback found!');
        console.log('📄 arXiv Paper:', data.arxivPaper.title);
        console.log('🔗 PDF URL:', data.arxivPaper.url_pdf);
      } else {
        console.log('ℹ️ No arXiv equivalent found');
      }
    } else {
      console.error('❌ API Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
};

// Test the PDF URL resolution with arXiv prioritization
const testPdfUrlResolution = async () => {
  try {
    console.log('\n🧪 Testing PDF URL resolution with arXiv prioritization...');
    
    const testBibcode = '2023ApJ...951L..48B';
    
    const response = await fetch(`http://localhost:3002/api/ads/pdf-url?bibcode=${encodeURIComponent(testBibcode)}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ PDF URL Response:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('🎉 PDF URL resolved!');
        console.log('🔗 PDF URL:', data.pdfUrl);
        if (data.fallbackToArxiv) {
          console.log('📚 Using arXiv PDF (PRIORITIZED) - arXiv is now checked first!');
          console.log('📄 arXiv Paper:', data.arxivPaper?.title);
        } else {
          console.log('📄 Using ADS PDF (no arXiv equivalent found)');
        }
      } else {
        console.log('ℹ️ No PDF URL found');
      }
    } else {
      console.error('❌ API Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting arXiv fallback tests...\n');
  
  // Wait a bit for the server to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await testArxivFallback();
  await testPdfUrlResolution();
  
  console.log('\n✨ Tests completed!');
};

runTests();
