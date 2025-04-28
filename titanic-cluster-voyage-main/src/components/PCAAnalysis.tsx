
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from "@/components/ui/slider";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ScatterChart, Scatter, ZAxis 
} from 'recharts';
import { performPCA } from '@/services/mlService';
import { ProcessedData } from '@/utils/dataUtils';

interface PCAAnalysisProps {
  processedData: ProcessedData;
  onPcaDataReady: (pcaData: number[][], numComponents: number) => void;
}

const PCAAnalysis = ({ processedData, onPcaDataReady }: PCAAnalysisProps) => {
  const [numComponents, setNumComponents] = useState<number>(2);
  const [maxComponents, setMaxComponents] = useState<number>(2);
  const [explainedVariance, setExplainedVariance] = useState<{ component: number; variance: number; cumulative: number }[]>([]);
  const [projectedData, setProjectedData] = useState<{ x: number; y: number; id: number }[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<string>('None');
  const [pcaData, setPcaData] = useState<number[][]>([]);
  const hasRunPCA = useRef(false);

  // Only initialize PCA once when data is available
  useEffect(() => {
    if (processedData.processed.length > 0 && !hasRunPCA.current) {
      hasRunPCA.current = true;
      
      // Get maximum possible components
      const maxPossibleComponents = Math.min(
        processedData.processed.length,
        processedData.processed[0].length
      );
      
      setMaxComponents(maxPossibleComponents);
      
      // Run initial PCA to get explained variance for all components
      const { projectedData: fullPcaData, explainedVariance: varianceRatios } = performPCA(
        processedData.processed
      );
      
      // Calculate cumulative explained variance
      const varianceData = varianceRatios.map((variance, idx) => {
        const previousCumulative = idx > 0 ? explainedVariance[idx - 1]?.cumulative || 0 : 0;
        return {
          component: idx + 1,
          variance,
          cumulative: previousCumulative + variance
        };
      });
      
      setExplainedVariance(varianceData);
      
      // Run PCA with selected number of components
      const { projectedData: initialPcaData } = performPCA(
        processedData.processed,
        numComponents
      );
      
      setPcaData(initialPcaData);
      onPcaDataReady(initialPcaData, numComponents);
      
      // Create scatter plot data for the first two components
      const scatterData = initialPcaData.map((point, idx) => ({
        x: point[0],
        y: point.length > 1 ? point[1] : 0,
        id: idx
      }));
      
      setProjectedData(scatterData);
    }
  }, [processedData, numComponents, onPcaDataReady]);

  const handleComponentsChange = (value: number[]) => {
    const newNumComponents = value[0];
    setNumComponents(newNumComponents);
    
    // Run PCA with new number of components
    const { projectedData: newPcaData } = performPCA(
      processedData.processed,
      newNumComponents
    );
    
    setPcaData(newPcaData);
    onPcaDataReady(newPcaData, newNumComponents);
    
    // Update scatter plot data for the first two components
    const scatterData = newPcaData.map((point, idx) => ({
      x: point[0],
      y: point.length > 1 ? point[1] : 0,
      id: idx
    }));
    
    setProjectedData(scatterData);
  };

  const getScatterDataWithColor = () => {
    if (selectedFeature === 'None' || !processedData.original) {
      return projectedData;
    }

    return projectedData.map((point, idx) => ({
      ...point,
      color: processedData.original[idx][selectedFeature]
    }));
  };

  const getColorOptions = () => {
    if (!processedData.original || processedData.original.length === 0) {
      return [];
    }

    const allFeatures = Object.keys(processedData.original[0])
      .filter(key => {
        // Only include features that are good for coloring (categorical or small range numerical)
        const firstVal = processedData.original[0][key];
        if (typeof firstVal === 'number') {
          const uniqueValues = new Set(processedData.original.map(p => p[key]));
          return uniqueValues.size <= 10; // Only include numerical features with few unique values
        }
        return typeof firstVal === 'string';
      });

    return ['None', ...allFeatures];
  };

  const COLORS = [
    '#1f77b4', // blue
    '#ff7f0e', // orange
    '#2ca02c', // green
    '#d62728', // red
    '#9467bd', // purple
    '#8c564b', // brown
    '#e377c2', // pink
    '#7f7f7f', // gray
    '#bcbd22', // yellow-green
    '#17becf', // teal
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Principal Component Analysis</CardTitle>
        <CardDescription>
          Reduce dimensionality while preserving variance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-md font-medium mb-2">Explained Variance</h3>
            <div className="chart-container h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={explainedVariance}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="component"
                    label={{ value: 'Number of Components', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    domain={[0, 1]}
                    label={{ value: 'Explained Variance Ratio', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip formatter={(value: number) => (value * 100).toFixed(2) + '%'} />
                  <Line type="monotone" dataKey="variance" stroke="hsl(var(--primary))" name="Variance" />
                  <Line type="monotone" dataKey="cumulative" stroke="hsl(var(--secondary))" name="Cumulative" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Number of Components: {numComponents}</span>
                <span className="text-sm">
                  Explained Variance: {(explainedVariance[numComponents - 1]?.cumulative * 100 || 0).toFixed(2)}%
                </span>
              </div>
              <Slider
                value={[numComponents]}
                min={1}
                max={maxComponents}
                step={1}
                onValueChange={handleComponentsChange}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium">PCA Projection (PC1 vs PC2)</h3>
              <div className="flex items-center space-x-2">
                <label className="text-sm">Color by:</label>
                <select
                  value={selectedFeature}
                  onChange={(e) => setSelectedFeature(e.target.value)}
                  className="text-sm border rounded p-1"
                >
                  {getColorOptions().map(feature => (
                    <option key={feature} value={feature}>{feature}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="chart-container h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="PC1"
                    label={{ value: 'PC1', position: 'bottom', offset: 0 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="PC2"
                    label={{ value: 'PC2', angle: -90, position: 'left' }}
                  />
                  <ZAxis range={[20, 20]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value: any) => value.toFixed(3)}
                  />
                  
                  {selectedFeature === 'None' ? (
                    <Scatter
                      name="Passengers"
                      data={projectedData}
                      fill="hsl(var(--primary))"
                    />
                  ) : (
                    // Render different scatters based on the unique values in the selected feature
                    (() => {
                      if (!processedData.original || processedData.original.length === 0) {
                        return null;
                      }
                      
                      const uniqueValues = [...new Set(processedData.original.map(p => p[selectedFeature]))];
                      
                      return uniqueValues.map((value, index) => {
                        const pointsWithValue = projectedData.filter((point, idx) => 
                          processedData.original[idx][selectedFeature] === value
                        );
                        
                        return (
                          <Scatter
                            key={String(value)}
                            name={`${selectedFeature}=${value}`}
                            data={pointsWithValue}
                            fill={COLORS[index % COLORS.length]}
                          />
                        );
                      });
                    })()
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start">
        <div className="text-sm text-muted-foreground">
          <strong>Principal Components:</strong> The graph on the left shows the explained variance for each component.
          <br />
          <strong>PCA Projection:</strong> The scatter plot on the right shows the data projected onto the first two principal components.
        </div>
      </CardFooter>
    </Card>
  );
};

export default PCAAnalysis;
