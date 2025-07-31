import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Error {
  type: 'grammar' | 'spelling' | 'punctuation' | 'capitalization' | 'format';
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

  const getErrorColor = (type: Error['type']) => {
    switch (type) {
      case 'grammar':
        return 'bg-error text-error-foreground';
      case 'spelling':
        return 'bg-warning text-warning-foreground';
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
      case 'format':
        return <FileText className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
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
          onClick={() => setSelectedError(error)}
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
          <Button variant="outline" size="sm">
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
                {type === 'spelling' && 'Ejaan'}
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
        <Card className="p-4 border-l-4 border-l-primary">
          <div className="flex items-start gap-3">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", getErrorColor(selectedError.type))}>
              {getErrorIcon(selectedError.type)}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">
                {selectedError.type === 'grammar' && 'Kesalahan Tata Bahasa'}
                {selectedError.type === 'spelling' && 'Kesalahan Ejaan'}
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