import React from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import './PDFGenerator.css';

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    padding: 60,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  h1: {
    fontSize: 20,
    marginTop: 20,
    marginBottom: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  h2: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
  },
  h3: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#444',
  },
  paragraph: {
    marginBottom: 8,
    lineHeight: 1.6,
    textAlign: 'justify',
  },
  codeBlock: {
    backgroundColor: '#f4f4f4',
    padding: 10,
    marginVertical: 8,
    fontFamily: 'Courier',
    fontSize: 9,
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#666',
  },
  tocTitle: {
    fontSize: 22,
    marginBottom: 20,
    fontFamily: 'Helvetica-Bold',
  },
  tocItem: {
    marginBottom: 8,
    fontSize: 11,
  },
});

function PDFGenerator({ content, originalContent }) {
  
  const parseContent = (text) => {
    const lines = text.split('\n');
    const sections = [];
    let currentSection = null;
    let inCodeBlock = false;
    let codeContent = [];
    let tocItems = [];
    
    for (let line of lines) {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // Close code block
          if (currentSection) {
            currentSection.content.push({
              type: 'code',
              text: codeContent.join('\n')
            });
          }
          codeContent = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        continue;
      }
      
      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }
      
      if (line.startsWith('# ')) {
        if (currentSection) sections.push(currentSection);
        const title = line.substring(2);
        tocItems.push({ level: 1, title });
        currentSection = { type: 'h1', title, content: [] };
      } else if (line.startsWith('## ')) {
        if (currentSection) sections.push(currentSection);
        const title = line.substring(3);
        tocItems.push({ level: 2, title });
        currentSection = { type: 'h2', title, content: [] };
      } else if (line.startsWith('### ')) {
        if (currentSection) sections.push(currentSection);
        const title = line.substring(4);
        tocItems.push({ level: 3, title });
        currentSection = { type: 'h3', title, content: [] };
      } else if (line.trim()) {
        if (!currentSection) {
          currentSection = { type: 'section', title: '', content: [] };
        }
        // Remove markdown bold markers for PDF
        const cleanLine = line.replace(/\*\*(.*?)\*\*/g, '$1');
        currentSection.content.push({
          type: 'paragraph',
          text: cleanLine
        });
      }
    }
    
    if (currentSection) sections.push(currentSection);
    
    return { sections, tocItems };
  };

  const { sections, tocItems } = parseContent(content);
  
  // Extract document title (first H1 or default)
  const documentTitle = sections.find(s => s.type === 'h1')?.title || 'Formatted Document';
  const today = new Date().toLocaleDateString();

  const PDFDocument = () => (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View>
          <Text style={styles.title}>{documentTitle}</Text>
          <Text style={styles.subtitle}>Generated on {today}</Text>
        </View>
        <Text style={styles.footer}>Page 1</Text>
      </Page>
      
      {/* Table of Contents */}
      {tocItems.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.tocTitle}>Table of Contents</Text>
          {tocItems.map((item, idx) => (
            <Text 
              key={idx} 
              style={[
                styles.tocItem, 
                { marginLeft: (item.level - 1) * 15 }
              ]}
            >
              {item.title}
            </Text>
          ))}
          <Text style={styles.footer}>Page 2</Text>
        </Page>
      )}
      
      {/* Content Pages */}
      <Page size="A4" style={styles.page}>
        {sections.map((section, idx) => (
          <View key={idx}>
            {section.type === 'h1' && (
              <Text style={styles.h1}>{section.title}</Text>
            )}
            {section.type === 'h2' && (
              <Text style={styles.h2}>{section.title}</Text>
            )}
            {section.type === 'h3' && (
              <Text style={styles.h3}>{section.title}</Text>
            )}
            {section.content.map((item, contentIdx) => (
              <View key={contentIdx}>
                {item.type === 'paragraph' && (
                  <Text style={styles.paragraph}>{item.text}</Text>
                )}
                {item.type === 'code' && (
                  <Text style={styles.codeBlock}>{item.text}</Text>
                )}
              </View>
            ))}
          </View>
        ))}
        <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );

  return (
    <div className="pdf-generator">
      <div className="section-header">
        <h2>📄 Export to PDF</h2>
      </div>
      
      <div className="pdf-actions">
        <PDFDownloadLink
          document={<PDFDocument />}
          fileName={`${documentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`}
          className="download-button"
        >
          {({ loading }) =>
            loading ? (
              <>
                <span className="spinner"></span>
                Preparing PDF...
              </>
            ) : (
              <>
                ⬇️ Download PDF
              </>
            )
          }
        </PDFDownloadLink>
        
        <div className="pdf-info">
          <p>✅ Professional formatting with headers</p>
          <p>✅ Table of contents included</p>
          <p>✅ Code blocks properly styled</p>
          <p>✅ Page numbers in footer</p>
        </div>
      </div>
    </div>
  );
}

export default PDFGenerator;