import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { TextPreview } from '@/components/TextPreview';
import { checkGrammar, type GrammarError } from '@/lib/grammarChecker';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle, Users, Zap } from 'lucide-react';
import heroImage from '@/assets/hero-bg.jpg';

const Index = () => {
  const [fileContent, setFileContent] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [errors, setErrors] = useState<GrammarError[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileContent = async (content: string, name: string) => {
    setFileContent(content);
    setFilename(name);
    setIsAnalyzing(true);
    
    // Simulate processing time
    setTimeout(() => {
      const foundErrors = checkGrammar(content);
      setErrors(foundErrors);
      setIsAnalyzing(false);
    }, 1500);
  };

  const resetAnalysis = () => {
    setFileContent('');
    setFilename('');
    setErrors([]);
    setIsAnalyzing(false);
  };

  if (fileContent) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Analisis Dokumen</h1>
              <p className="text-muted-foreground">Hasil pemeriksaan tata bahasa Indonesia</p>
            </div>
            <Button onClick={resetAnalysis} variant="outline">
              Analisis Dokumen Baru
            </Button>
          </div>
          
          {isAnalyzing ? (
            <Card className="p-12 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">Menganalisis Dokumen...</h3>
              <p className="text-muted-foreground">Sedang memeriksa tata bahasa, ejaan, dan tanda baca</p>
            </Card>
          ) : (
            <TextPreview 
              content={fileContent} 
              filename={filename} 
              errors={errors}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative py-24 bg-gradient-hero overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(239, 68, 68, 0.8), rgba(251, 146, 60, 0.8)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30">
              🇮🇩 Untuk Bahasa Indonesia
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Resik Bahasa
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Platform cerdas untuk memeriksa tata bahasa, ejaan, dan tanda baca dalam dokumen Bahasa Indonesia Anda
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Deteksi Grammar</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Koreksi Ejaan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Pemeriksaan Tanda Baca</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Mulai Analisis Dokumen</h2>
              <p className="text-lg text-muted-foreground">
                Unggah dokumen Anda dan dapatkan analisis komprehensif dalam hitungan detik
              </p>
            </div>
            
            <FileUpload onFileContent={handleFileContent} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Fitur Unggulan</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Teknologi canggih untuk memastikan dokumen Anda menggunakan Bahasa Indonesia yang baik dan benar
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-6 text-center hover:shadow-elegant transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-error to-warning rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Pemeriksaan Grammar</h3>
              <p className="text-muted-foreground">
                Deteksi kesalahan struktur kalimat dan urutan kata sesuai kaidah SPOK Bahasa Indonesia
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-elegant transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-warning to-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Koreksi Ejaan</h3>
              <p className="text-muted-foreground">
                Identifikasi kata tidak baku, typo, dan kesalahan penggunaan awalan serta imbuhan
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-elegant transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-success rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Tanda Baca & Kapitalisasi</h3>
              <p className="text-muted-foreground">
                Periksa penggunaan tanda baca yang benar dan kapitalisasi yang sesuai aturan
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Siap Memeriksa Dokumen Anda?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Tingkatkan kualitas tulisan Bahasa Indonesia Anda dengan teknologi pemeriksaan otomatis
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-hero text-white hover:opacity-90 shadow-glow"
              onClick={() => {
                document.querySelector('#upload-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Mulai Sekarang
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;