
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { preprocessData, ProcessedData, TitanicPassenger } from '@/utils/dataUtils';

interface DataPreprocessingProps {
  data: TitanicPassenger[];
  onProcessingComplete: (processedData: ProcessedData) => void;
}

const DataPreprocessing = ({ data, onProcessingComplete }: DataPreprocessingProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState<ProcessedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    rowCount: number;
    columnCount: number;
    missingValues: Record<string, number>;
    featureTypes: {
      numerical: string[];
      categorical: string[];
    };
  }>({
    rowCount: 0,
    columnCount: 0,
    missingValues: {},
    featureTypes: {
      numerical: [],
      categorical: []
    }
  });

  // Calculate basic stats when data changes
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Count rows and columns
    const rowCount = data.length;
    const columnCount = data[0] ? Object.keys(data[0]).length : 0;
    
    // Count missing values by column
    const missingValues: Record<string, number> = {};
    const columns = data[0] ? Object.keys(data[0]) : [];
    
    columns.forEach(column => {
      const missing = data.filter(row => 
        row[column] === null || 
        row[column] === undefined || 
        (typeof row[column] === 'string' && row[column] === '')
      ).length;
      
      missingValues[column] = missing;
    });
    
    // Identify feature types
    const numerical: string[] = [];
    const categorical: string[] = [];
    
    columns.forEach(column => {
      // Check first non-null value
      const firstNonNull = data.find(row => row[column] !== null && row[column] !== undefined);
      if (firstNonNull) {
        if (typeof firstNonNull[column] === 'number') {
          numerical.push(column);
        } else {
          categorical.push(column);
        }
      } else {
        categorical.push(column); // Default to categorical if all null
      }
    });
    
    setStats({
      rowCount,
      columnCount,
      missingValues,
      featureTypes: {
        numerical,
        categorical
      }
    });
    
  }, [data]);

  const handleStartProcessing = async () => {
    if (!data || data.length === 0) return;
    
    setIsProcessing(true);
    setProgress(0);
    setCurrentStep('Initializing...');
    setError(null);
    
    try {
      // Simulate steps with progress updates
      setCurrentStep('Feature engineering...');
      await simulateProgress(20);
      
      setCurrentStep('Handling missing values...');
      await simulateProgress(40);
      
      setCurrentStep('Encoding categorical features...');
      await simulateProgress(60);
      
      setCurrentStep('Standardizing numerical features...');
      await simulateProgress(80);
      
      setCurrentStep('Finalizing...');
      
      // Actual processing
      const processedData = preprocessData(data);
      
      setResult(processedData);
      setProgress(100);
      setCurrentStep('Processing complete!');
      onProcessingComplete(processedData);
      
    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateProgress = (targetProgress: number) => {
    return new Promise<void>(resolve => {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= targetProgress) {
            clearInterval(interval);
            resolve();
            return targetProgress;
          }
          return prev + 1;
        });
      }, 20); // Update progress every 20ms
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Preprocessing</CardTitle>
        <CardDescription>
          Prepare the dataset for analysis by handling missing values and encoding features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Data Summary */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="summary">
              <AccordionTrigger>Dataset Summary</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted p-2 rounded">
                      <p className="text-sm font-medium">Rows</p>
                      <p className="text-2xl">{stats.rowCount}</p>
                    </div>
                    <div className="bg-muted p-2 rounded">
                      <p className="text-sm font-medium">Columns</p>
                      <p className="text-2xl">{stats.columnCount}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Feature Types</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted p-2 rounded">
                        <p className="text-xs text-muted-foreground">Numerical ({stats.featureTypes.numerical.length})</p>
                        <p className="text-sm">{stats.featureTypes.numerical.join(', ')}</p>
                      </div>
                      <div className="bg-muted p-2 rounded">
                        <p className="text-xs text-muted-foreground">Categorical ({stats.featureTypes.categorical.length})</p>
                        <p className="text-sm">{stats.featureTypes.categorical.join(', ')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Missing Values</p>
                    <div className="space-y-1">
                      {Object.entries(stats.missingValues)
                        .filter(([_, count]) => count > 0)
                        .sort(([_, countA], [__, countB]) => countB - countA)
                        .map(([column, count]) => (
                          <div key={column} className="flex items-center justify-between">
                            <span className="text-sm">{column}</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={(count / stats.rowCount) * 100} className="w-24 h-2" />
                              <span className="text-xs text-muted-foreground">
                                {count} ({((count / stats.rowCount) * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      {Object.values(stats.missingValues).every(count => count === 0) && (
                        <p className="text-sm text-muted-foreground">No missing values!</p>
                      )}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="preprocessing">
              <AccordionTrigger>Preprocessing Steps</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <div className="bg-muted p-3 rounded">
                    <h4 className="font-medium">1. Feature Engineering</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-1">
                      <li>Create <code>FamilySize</code> by combining SibSp + Parch + 1</li>
                      <li>Extract <code>Title</code> from Name field (Mr, Mrs, etc.)</li>
                      <li>Create <code>HasCabin</code> binary feature based on Cabin availability</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted p-3 rounded">
                    <h4 className="font-medium">2. Feature Selection</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-1">
                      <li>Remove irrelevant features (PassengerId, Ticket)</li>
                      <li>Remove Name after extracting Title</li>
                      <li>Remove Cabin after creating HasCabin (high missingness)</li>
                      <li>Separate Survived column (target variable)</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted p-3 rounded">
                    <h4 className="font-medium">3. Missing Value Imputation</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-1">
                      <li>Numerical features: replace with median value</li>
                      <li>Categorical features: replace with most frequent value</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted p-3 rounded">
                    <h4 className="font-medium">4. Feature Encoding</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-1">
                      <li>One-hot encode categorical features (Sex, Embarked, Title)</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted p-3 rounded">
                    <h4 className="font-medium">5. Feature Scaling</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-1">
                      <li>Standardize numerical features (mean=0, std=1)</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          {/* Processing Status */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{currentStep}</span>
                <span className="text-sm">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Success Message */}
          {result && !isProcessing && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Data preprocessing completed successfully! 
                {result.processed.length > 0 && (
                  <>
                    <br />
                    Processed {result.processed.length} rows with {result.features.length} features.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleStartProcessing} 
          disabled={isProcessing || data.length === 0}
        >
          {isProcessing ? 'Processing...' : result ? 'Reprocess Data' : 'Process Data'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DataPreprocessing;
