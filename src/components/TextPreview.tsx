import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, Download, AlertTriangle, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import html2pdf from 'html2pdf.js';

interface Error {
  type: 'grammar' | 'spelling' | 'misspelling' | 'informal' | 'punctuation' | 'capitalization' | 'format';
  text: string;
  suggestion: string;
  start: number;
  end: number;
}

interface TextPreviewProps {
  content: string;
  filename: string;
  errors: Error[];
}

export const TextPreview = ({ content, filename, errors }: TextPreviewProps) => {
  const [selectedError, setSelectedError] = useState<Error | null>(null);
  const errorDetailsRef = useRef<HTMLDivElement>(null);

  const handleErrorClick = (error: Error) => {
    setSelectedError(error);
    // Scroll to error details section with smooth animation
    setTimeout(() => {
      errorDetailsRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 100);
  };

  const getErrorColor = (type: Error['type']) => {
    switch (type) {
      case 'grammar':
        return 'bg-error text-error-foreground';
      case 'spelling':
        return 'bg-warning text-warning-foreground';
      case 'misspelling':
        return 'bg-red-500 text-white';
      case 'informal':
        return 'bg-blue-500 text-white';
      case 'punctuation':
        return 'bg-destructive text-destructive-foreground';
      case 'capitalization':
        return 'bg-primary text-primary-foreground';
      case 'format':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getErrorIcon = (type: Error['type']) => {
    switch (type) {
      case 'grammar':
        return <XCircle className="w-4 h-4" />;
      case 'spelling':
        return <AlertTriangle className="w-4 h-4" />;
      case 'misspelling':
        return <XCircle className="w-4 h-4" />;
      case 'informal':
        return <AlertTriangle className="w-4 h-4" />;
      case 'format':
        return <FileText className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const downloadDOCX = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Header
          new Paragraph({
            text: `Hasil Analisis - ${filename}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          
          // Content with highlighted errors
          ...generateDocxContent(),
          
          // Error details if any
          ...(errors.length > 0 ? [
            new Paragraph({ text: "" }),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: "DETAIL KESALAHAN",
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "" }),
            ...generateDocxErrorDetails()
          ] : [])
        ]
      }]
    });

    // Use toBlob instead of toBuffer for browser compatibility
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/\.[^/.]+$/, '')}_hasil_analisis.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const htmlContent = generatePDFHTML();
    const options = {
      margin: [1, 1, 1, 1],
      filename: `${filename.replace(/\.[^/.]+$/, '')}_hasil_analisis.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(options).from(htmlContent).save();
  };

  const generateDocxContent = () => {
    if (errors.length === 0) {
      return content.split('\n').map(line => 
        new Paragraph({ text: line || " " })
      );
    }

    const sortedErrors = [...errors].sort((a, b) => a.start - b.start);
    const result = [];
    let lastIndex = 0;

    // Build text with inline highlighting, similar to PDF
    let processedText = '';
    
    sortedErrors.forEach((error) => {
      // Add text before error
      if (error.start > lastIndex) {
        processedText += content.slice(lastIndex, error.start);
      }
      
      // Add highlighted error text (inline, like PDF)
      processedText += error.text;
      lastIndex = error.end;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      processedText += content.slice(lastIndex);
    }

    // Convert to paragraphs with proper highlighting
    let textIndex = 0;
    const lines = processedText.split('\n');
    
    lines.forEach(line => {
      if (line.length === 0) {
        result.push(new Paragraph({ text: " " }));
        textIndex += 1; // account for newline
        return;
      }

      const lineStart = textIndex;
      const lineEnd = textIndex + line.length;
      const lineErrors = sortedErrors.filter(error => 
        (error.start >= lineStart && error.start < lineEnd) ||
        (error.end > lineStart && error.end <= lineEnd) ||
        (error.start < lineStart && error.end > lineEnd)
      );

      if (lineErrors.length === 0) {
        result.push(new Paragraph({ text: line }));
      } else {
        const children = [];
        let lineLastIndex = 0;

        lineErrors.forEach(error => {
          const errorStartInLine = Math.max(0, error.start - lineStart);
          const errorEndInLine = Math.min(line.length, error.end - lineStart);

          // Add text before error
          if (errorStartInLine > lineLastIndex) {
            children.push(new TextRun({
              text: line.slice(lineLastIndex, errorStartInLine)
            }));
          }

          // Add highlighted error text
          children.push(new TextRun({
            text: line.slice(errorStartInLine, errorEndInLine),
            highlight: getDocxErrorColor(error.type)
          }));

          lineLastIndex = errorEndInLine;
        });

        // Add remaining text in line
        if (lineLastIndex < line.length) {
          children.push(new TextRun({
            text: line.slice(lineLastIndex)
          }));
        }

        result.push(new Paragraph({ children }));
      }

      textIndex += line.length + 1; // +1 for newline
    });

    return result;
  };

  const generateDocxErrorDetails = () => {
    return errors.map((error, index) => [
      new Paragraph({
        children: [
          new TextRun({
            text: `${index + 1}. ${getErrorTypeName(error.type)}`,
            bold: true,
            size: 24
          })
        ],
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Ditemukan: ", bold: true }),
          new TextRun({ 
            text: `"${error.text}"`, 
            italics: true,
            highlight: getDocxErrorColor(error.type)
          })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Saran: ", bold: true }),
          new TextRun({ text: error.suggestion })
        ],
        spacing: { after: 200 }
      })
    ]).flat();
  };

  const getDocxErrorColor = (type: Error['type']) => {
    switch (type) {
      case 'grammar': return 'red';
      case 'spelling': return 'yellow';
      case 'misspelling': return 'red';
      case 'informal': return 'cyan';
      case 'punctuation': return 'red';
      case 'capitalization': return 'blue';
      case 'format': return 'yellow';
      default: return 'lightGray';
    }
  };

  const getErrorTypeName = (type: Error['type']) => {
    const names = {
      grammar: 'Kesalahan Tata Bahasa',
      spelling: 'Kata Tidak Dikenal',
      misspelling: 'Kesalahan Pengetikan',
      informal: 'Kata Tidak Baku',
      punctuation: 'Kesalahan Tanda Baca',
      capitalization: 'Kesalahan Kapitalisasi',
      format: 'Kesalahan Format Dokumen'
    };
    return names[type] || type;
  };

  const generatePDFHTML = () => {
    const highlightedText = generateHighlightedHTML(content);
    const errorDetails = generateErrorDetailsHTML();
    
    return `
<div style="font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.8; color: #000;">
  <h1 style="text-align: center; margin-bottom: 30px; font-size: 24px; font-weight: bold;">Hasil Analisis - ${filename}</h1>
  
  <div style="white-space: pre-wrap; margin-bottom: 40px; font-size: 14px; text-align: justify;">${highlightedText}</div>
  
  ${errors.length > 0 ? `
  <div style="page-break-before: always;">
    <h2 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 5px; margin-top: 30px; margin-bottom: 20px; font-size: 18px;">Detail Kesalahan</h2>
    ${errorDetails}
  </div>
  ` : ''}
</div>`;
  };

  const generateHighlightedHTML = (text: string) => {
    if (errors.length === 0) return text.replace(/\n/g, '<br>');

    const sortedErrors = [...errors].sort((a, b) => a.start - b.start);
    let result = '';
    let lastIndex = 0;

    sortedErrors.forEach((error) => {
      if (error.start > lastIndex) {
        result += text.slice(lastIndex, error.start).replace(/\n/g, '<br>');
      }
      result += `<span style="background-color: ${getPDFErrorColor(error.type)}; padding: 1px 3px; border-radius: 2px; border: 1px solid ${getBorderColor(error.type)}; font-weight: 500;">${error.text}</span>`;
      lastIndex = error.end;
    });

    if (lastIndex < text.length) {
      result += text.slice(lastIndex).replace(/\n/g, '<br>');
    }

    return result;
  };

  const getPDFErrorColor = (type: Error['type']) => {
    switch (type) {
      case 'grammar': return '#fef2f2';
      case 'spelling': return '#fef3c7';
      case 'misspelling': return '#fee2e2';
      case 'informal': return '#dbeafe';
      case 'punctuation': return '#fecaca';
      case 'capitalization': return '#e0e7ff';
      case 'format': return '#fed7aa';
      default: return '#f3f4f6';
    }
  };

  const generateErrorDetailsHTML = () => {
    return errors.map((error, index) => `
      <div style="margin-bottom: 15px; padding: 10px; border-radius: 5px; border-left: 4px solid ${getBorderColor(error.type)}; background-color: ${getPDFErrorColor(error.type)};">
        <div style="font-weight: bold; margin-bottom: 5px;">${index + 1}. ${getErrorTypeName(error.type)}</div>
        <div>Ditemukan: <span style="font-family: monospace; background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px;">"${error.text}"</span></div>
        <div><strong>Saran:</strong> ${error.suggestion}</div>
      </div>
    `).join('');
  };

  const getBorderColor = (type: Error['type']) => {
    switch (type) {
      case 'grammar': return '#991b1b';
      case 'spelling': return '#92400e';
      case 'misspelling': return '#dc2626';
      case 'informal': return '#1d4ed8';
      case 'punctuation': return '#b91c1c';
      case 'capitalization': return '#3730a3';
      case 'format': return '#c2410c';
      default: return '#6b7280';
    }
  };

  const highlightErrors = (text: string) => {
    if (errors.length === 0) return text;

    const sortedErrors = [...errors].sort((a, b) => a.start - b.start);
    let result = [];
    let lastIndex = 0;

    sortedErrors.forEach((error, index) => {
      // Add text before error
      if (error.start > lastIndex) {
        result.push(text.slice(lastIndex, error.start));
      }

      // Add highlighted error text
      result.push(
        <span
          key={index}
          className={cn(
            "cursor-pointer rounded px-1 transition-all duration-200 hover:opacity-80",
            getErrorColor(error.type)
          )}
          onClick={() => handleErrorClick(error)}
          title={`${error.type}: ${error.suggestion}`}
        >
          {error.text}
        </span>
      );

      lastIndex = error.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex));
    }

    return result;
  };

  const errorCounts = errors.reduce((acc, error) => {
    acc[error.type] = (acc[error.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* File Info */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{filename}</h3>
              <p className="text-sm text-muted-foreground">
                {content.split(' ').length} kata • {content.length} karakter
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Unduh Hasil
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={downloadDOCX}>
                <FileText className="w-4 h-4 mr-2" />
                Download sebagai DOCX
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Download sebagai PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      {/* Error Summary */}
      {errors.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Ringkasan Kesalahan
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(errorCounts).map(([type, count]) => (
              <Badge key={type} variant="secondary" className="gap-1">
                {getErrorIcon(type as Error['type'])}
                {type === 'grammar' && 'Tata Bahasa'}
                {type === 'spelling' && 'Kata Tidak Dikenal'}
                {type === 'misspelling' && 'Salah Ketik'}
                {type === 'informal' && 'Kata Tidak Baku'}
                {type === 'punctuation' && 'Tanda Baca'}
                {type === 'capitalization' && 'Kapitalisasi'}
                {type === 'format' && 'Format Dokumen'}
                : {count}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Text Content */}
      <Card className="p-0">
        {/* Document-like container with Word margins */}
        <div className="bg-white min-h-[600px] shadow-sm">
          <div 
            className="prose max-w-none px-10 pt-12 pb-10"
            style={{
              paddingTop: '3cm',
              paddingLeft: '2.5cm', 
              paddingRight: '2.5cm',
              paddingBottom: '2.5cm',
              minHeight: '29.7cm', // A4 height
              width: '21cm', // A4 width
              margin: '0 auto',
              backgroundColor: 'white',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)'
            }}
          >
            <div className="whitespace-pre-wrap leading-relaxed text-base font-medium text-black">
              {highlightErrors(content)}
            </div>
          </div>
        </div>
      </Card>

      {/* Error Details */}
      {selectedError && (
        <Card 
          ref={errorDetailsRef}
          className="p-4 border-l-4 border-l-primary animate-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", getErrorColor(selectedError.type))}>
              {getErrorIcon(selectedError.type)}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">
                {selectedError.type === 'grammar' && 'Kesalahan Tata Bahasa'}
                {selectedError.type === 'spelling' && 'Kata Tidak Dikenal'}
                {selectedError.type === 'misspelling' && 'Kesalahan Pengetikan'}
                {selectedError.type === 'informal' && 'Kata Tidak Baku'}
                {selectedError.type === 'punctuation' && 'Kesalahan Tanda Baca'}
                {selectedError.type === 'capitalization' && 'Kesalahan Kapitalisasi'}
                {selectedError.type === 'format' && 'Kesalahan Format Dokumen'}
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Ditemukan: <span className="font-mono bg-muted px-1 rounded">"{selectedError.text}"</span>
              </p>
              <p className="text-sm">
                <strong>Saran:</strong> {selectedError.suggestion}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedError(null)}
            >
              ×
            </Button>
          </div>
        </Card>
      )}

      {/* Success State */}
      {errors.length === 0 && content && (
        <Card className="p-6 border-l-4 border-l-success bg-success/5">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-success" />
            <div>
              <h3 className="font-semibold text-success">Dokumen Sudah Benar!</h3>
              <p className="text-sm text-muted-foreground">
                Tidak ditemukan kesalahan tata bahasa, ejaan, atau tanda baca.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
