import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const downloadResults = () => {
    const htmlContent = generateDownloadHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/\.[^/.]+$/, '')}_hasil_analisis.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateDownloadHTML = () => {
    const highlightedText = generateHighlightedHTML(content);
    const errorDetails = generateErrorDetailsHTML();
    
    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hasil Analisis - ${filename}</title>
    <style>
        body { 
            font-family: 'Times New Roman', serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f5f5f5; 
        }
        .document { 
            max-width: 21cm; 
            margin: 0 auto; 
            background: white; 
            padding: 3cm 2.5cm; 
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            min-height: 29.7cm;
        }
        .content { 
            line-height: 1.6; 
            font-size: 12pt; 
            white-space: pre-wrap; 
        }
        .error-grammar { background-color: #fef2f2; color: #991b1b; padding: 2px 4px; border-radius: 3px; }
        .error-spelling { background-color: #fef3c7; color: #92400e; padding: 2px 4px; border-radius: 3px; }
        .error-misspelling { background-color: #fee2e2; color: #dc2626; padding: 2px 4px; border-radius: 3px; }
        .error-informal { background-color: #dbeafe; color: #1d4ed8; padding: 2px 4px; border-radius: 3px; }
        .error-punctuation { background-color: #fecaca; color: #b91c1c; padding: 2px 4px; border-radius: 3px; }
        .error-capitalization { background-color: #e0e7ff; color: #3730a3; padding: 2px 4px; border-radius: 3px; }
        .error-format { background-color: #fed7aa; color: #c2410c; padding: 2px 4px; border-radius: 3px; }
        .page-break { page-break-before: always; }
        .error-details { margin-top: 2cm; }
        .error-item { 
            margin-bottom: 15px; 
            padding: 10px; 
            border-radius: 5px;
            border-left: 4px solid;
        }
        .error-item-grammar { background-color: #fef2f2; border-left-color: #991b1b; }
        .error-item-spelling { background-color: #fef3c7; border-left-color: #92400e; }
        .error-item-misspelling { background-color: #fee2e2; border-left-color: #dc2626; }
        .error-item-informal { background-color: #dbeafe; border-left-color: #1d4ed8; }
        .error-item-punctuation { background-color: #fecaca; border-left-color: #b91c1c; }
        .error-item-capitalization { background-color: #e0e7ff; border-left-color: #3730a3; }
        .error-item-format { background-color: #fed7aa; border-left-color: #c2410c; }
        .error-title { font-weight: bold; margin-bottom: 5px; }
        .error-text { font-family: monospace; background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px; }
        h2 { color: #333; border-bottom: 2px solid #333; padding-bottom: 5px; }
        @media print {
            body { margin: 0; padding: 0; background: white; }
            .document { box-shadow: none; margin: 0; padding: 2.5cm; }
        }
    </style>
</head>
<body>
    <div class="document">
        <div class="content">${highlightedText}</div>
        ${errors.length > 0 ? `
        <div class="page-break"></div>
        <div class="error-details">
            <h2>Detail Kesalahan</h2>
            ${errorDetails}
        </div>
        ` : ''}
    </div>
</body>
</html>`;
  };

  const generateHighlightedHTML = (text: string) => {
    if (errors.length === 0) return text.replace(/\n/g, '<br>');

    const sortedErrors = [...errors].sort((a, b) => a.start - b.start);
    let result = '';
    let lastIndex = 0;

    sortedErrors.forEach((error) => {
      // Add text before error
      if (error.start > lastIndex) {
        result += text.slice(lastIndex, error.start).replace(/\n/g, '<br>');
      }

      // Add highlighted error text
      result += `<span class="error-${error.type}">${error.text}</span>`;
      lastIndex = error.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      result += text.slice(lastIndex).replace(/\n/g, '<br>');
    }

    return result;
  };

  const generateErrorDetailsHTML = () => {
    const errorTypeNames = {
      grammar: 'Kesalahan Tata Bahasa',
      spelling: 'Kata Tidak Dikenal',
      misspelling: 'Kesalahan Pengetikan',
      informal: 'Kata Tidak Baku',
      punctuation: 'Kesalahan Tanda Baca',
      capitalization: 'Kesalahan Kapitalisasi',
      format: 'Kesalahan Format Dokumen'
    };

    return errors.map((error, index) => `
      <div class="error-item error-item-${error.type}">
        <div class="error-title">${index + 1}. ${errorTypeNames[error.type as keyof typeof errorTypeNames]}</div>
        <div>Ditemukan: <span class="error-text">"${error.text}"</span></div>
        <div><strong>Saran:</strong> ${error.suggestion}</div>
      </div>
    `).join('');
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
          <Button variant="outline" size="sm" onClick={downloadResults}>
            <Download className="w-4 h-4 mr-2" />
            Unduh Hasil
          </Button>
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
