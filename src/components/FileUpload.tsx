import { useState, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import mammoth from 'mammoth';

interface FileUploadProps {
  onFileContent: (content: string, filename: string, margins?: { top: number; bottom: number; left: number; right: number }) => void;
}

export const FileUpload = ({ onFileContent }: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileRead = useCallback(async (file: File) => {
    setIsUploading(true);
    
    try {
      if (file.name.endsWith('.docx')) {
        // Process .docx file with mammoth to extract text and margin info
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        
        // Simulate margin detection (in real implementation, you'd parse document.xml)
        // For demo purposes, we'll randomly assign margins to test the feature
        let margins = { top: 2.54, bottom: 2.54, left: 2.54, right: 2.54 }; // Default Word margins in cm
        
        // Simulate different margin scenarios for testing
        if (Math.random() > 0.5) {
          margins = { top: 2.0, bottom: 2.5, left: 2.5, right: 2.5 }; // Wrong margins for testing
        }
        
        onFileContent(result.value, file.name, margins);
      } else if (file.name.endsWith('.txt')) {
        const text = await file.text();
        onFileContent(text, file.name); // No margin info for txt files
      }
    } catch (error) {
      console.error('Error reading file:', error);
    } finally {
      setIsUploading(false);
    }
  }, [onFileContent]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const textFile = files.find(file => 
      file.type === 'text/plain' || 
      file.name.endsWith('.txt') || 
      file.name.endsWith('.docx')
    );
    
    if (textFile) {
      handleFileRead(textFile);
    }
  }, [handleFileRead]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileRead(file);
    }
  }, [handleFileRead]);

  return (
    <Card 
      className={cn(
        "border-2 border-dashed transition-all duration-300",
        isDragOver 
          ? "border-primary bg-primary/5 shadow-glow" 
          : "border-muted-foreground/25 hover:border-primary/50"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="p-12 text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-warning flex items-center justify-center">
          <Upload className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">
          Unggah Dokumen Anda
        </h3>
        
        <p className="text-muted-foreground mb-6">
          Seret dan lepas file atau klik tombol di bawah
        </p>
        
        <div className="space-y-2 text-sm text-muted-foreground mb-6">
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Format yang didukung: .txt, .docx</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <Button 
            variant="default" 
            className="relative overflow-hidden"
            disabled={isUploading}
          >
            <input
              type="file"
              accept=".txt,.docx"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            {isUploading ? 'Memproses...' : 'Pilih File'}
          </Button>
        </div>
      </div>
    </Card>
  );
};