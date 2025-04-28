
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { parseCSV } from '@/utils/dataUtils';
import { UploadCloud } from 'lucide-react';

interface FileUploadProps {
  onDataLoaded: (data: any[]) => void;
  isLoading: boolean;
}

const FileUpload = ({ onDataLoaded, isLoading }: FileUploadProps) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      const text = await file.text();
      const data = parseCSV(text);
      onDataLoaded(data);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Error loading file. Please ensure it is a valid CSV.');
    }
  };

  const handleExampleData = async () => {
    try {
      // Using example Titanic data
      const response = await fetch('https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv');
      const text = await response.text();
      const data = parseCSV(text);
      onDataLoaded(data);
    } catch (error) {
      console.error('Error loading example data:', error);
      alert('Error loading example data. Please try again later.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Dataset</CardTitle>
        <CardDescription>
          Upload the Titanic dataset or use the provided example data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop your CSV file here or click to browse
            </p>
            <Input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mx-auto max-w-xs cursor-pointer"
            />
          </div>
          {file && (
            <p className="text-sm">
              Selected: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleExampleData}
          disabled={isLoading}
        >
          Use Example Data
        </Button>
        <Button 
          onClick={handleUpload} 
          disabled={!file || isLoading}
        >
          Upload & Analyze
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FileUpload;
