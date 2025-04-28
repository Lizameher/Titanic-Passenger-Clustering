import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ScatterChart, Scatter, ZAxis 
} from 'recharts';
import { findOptimalK, performKMeans } from '@/services/mlService';
import { ProcessedData } from '@/utils/dataUtils';

interface KMeansAnalysisProps {
  processedData: ProcessedData;
  pcaData?: number[][];
  onClustersReady: (
    origClusters: number[],
    pcaClusters: number[],
    k: number
  ) => void;
}

const KMeansAnalysis = ({
  processedData,
  pcaData,
  onClustersReady
}: KMeansAnalysisProps) => {
  const [activeTab, setActiveTab] = useState<string>('elbow');
  const [clusterCount, setClusterCount] = useState<number>(3);
  const [elbowData, setElbowData] = useState<any[]>([]);
  const [silhouetteData, setSilhouetteData] = useState<any[]>([]);
  const [recommendedK, setRecommendedK] = useState<Record<string, number>>({
    elbow: 3,
    silhouette: 3
  });
  const [originalClusters, setOriginalClusters] = useState<number[]>([]);
  const [pcaClusters, setPcaClusters] = useState<number[]>([]);
  const [scatterData, setScatterData] = useState<any[]>([]);
  
  useEffect(() => {
    if (processedData.processed.length === 0) return;
    
    const { scores: inertiaScores, recommendedK: elbowK } = findOptimalK(
      processedData.processed,
      10,
      'elbow'
    );
    
    const elbowChartData = inertiaScores.map((score, idx) => ({
      k: idx + 2,
      score
    }));
    
    setElbowData(elbowChartData);
    
    const { scores: silhouetteScores, recommendedK: silhouetteK } = findOptimalK(
      processedData.processed,
      10,
      'silhouette'
    );
    
    const silhouetteChartData = silhouetteScores.map((score, idx) => ({
      k: idx + 2,
      score
    }));
    
    setSilhouetteData(silhouetteChartData);
    
    setRecommendedK({
      elbow: elbowK,
      silhouette: silhouetteK
    });
    
    setClusterCount(elbowK);
  }, [processedData]);
  
  useEffect(() => {
    if (processedData.processed.length === 0) return;
    
    const { labels: origLabels } = performKMeans(
      processedData.processed,
      clusterCount
    );
    
    setOriginalClusters(origLabels);
    
    if (pcaData && pcaData.length > 0) {
      const { labels: pcaLabels } = performKMeans(
        pcaData,
        clusterCount
      );
      
      setPcaClusters(pcaLabels);
      
      if (pcaData[0].length >= 2) {
        const newScatterData = pcaData.map((point, idx) => ({
          x: point[0],
          y: point[1],
          cluster: pcaLabels[idx]
        }));
        
        setScatterData(newScatterData);
      }
    }
    
    onClustersReady(
      origLabels,
      pcaData && pcaData.length > 0 ? pcaClusters : [],
      clusterCount
    );
  }, [processedData, pcaData, clusterCount, onClustersReady]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === 'elbow') {
      setClusterCount(recommendedK.elbow);
    } else if (value === 'silhouette') {
      setClusterCount(recommendedK.silhouette);
    }
  };
  
  const handleApplyK = () => {
    onClustersReady(
      originalClusters,
      pcaData && pcaData.length > 0 ? pcaClusters : [],
      clusterCount
    );
  };
  
  const CLUSTER_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(var(--accent))",
    "#e377c2",
    "#8c564b",
    "#d62728",
    "#9467bd",
    "#bcbd22",
    "#ff7f0e",
    "#17becf"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>K-means Clustering</CardTitle>
        <CardDescription>
          Identify natural groupings in the data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="elbow" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="elbow">Elbow Method</TabsTrigger>
            <TabsTrigger value="silhouette">Silhouette Score</TabsTrigger>
          </TabsList>
          
          <TabsContent value="elbow">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                The elbow method looks for the "bend" in the inertia curve, which indicates
                diminishing returns from adding more clusters. The optimal K is typically
                found at this elbow point.
              </p>
              <div className="chart-container h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={elbowData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="k"
                      label={{ value: 'Number of Clusters (K)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                      label={{ value: 'Inertia (Within-cluster sum of squares)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip formatter={(value: any) => value.toFixed(2)} />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" dot={{ r: 4 }} />
                    <Line
                      data={[{ k: recommendedK.elbow, score: elbowData.find(d => d.k === recommendedK.elbow)?.score }]}
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={0}
                      dot={{ r: 6, fill: "hsl(var(--destructive))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="silhouette">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                The silhouette score measures how similar objects are to their own cluster compared
                to other clusters. Higher silhouette values indicate better defined clusters.
              </p>
              <div className="chart-container h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={silhouetteData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="k"
                      label={{ value: 'Number of Clusters (K)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                      domain={[-1, 1]}
                      label={{ value: 'Silhouette Score', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip formatter={(value: any) => value.toFixed(3)} />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--secondary))" dot={{ r: 4 }} />
                    <Line
                      data={[{ k: recommendedK.silhouette, score: silhouetteData.find(d => d.k === recommendedK.silhouette)?.score }]}
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={0}
                      dot={{ r: 6, fill: "hsl(var(--destructive))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex flex-col space-y-4">
            <h3 className="text-md font-medium">Cluster Settings</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-grow">
                <label htmlFor="cluster-count" className="text-sm font-medium">
                  Number of Clusters (K): {clusterCount}
                </label>
                <div className="flex items-center space-x-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setClusterCount(Math.max(2, clusterCount - 1))}
                  >
                    -
                  </Button>
                  <input
                    id="cluster-count"
                    type="range"
                    min="2"
                    max="10"
                    value={clusterCount}
                    onChange={(e) => setClusterCount(parseInt(e.target.value))}
                    className="flex-grow"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setClusterCount(Math.min(10, clusterCount + 1))}
                  >
                    +
                  </Button>
                </div>
              </div>
              <Button onClick={handleApplyK}>Apply</Button>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                <strong>Recommended K:</strong>
                <br />
                Elbow Method: {recommendedK.elbow}
                <br />
                Silhouette Method: {recommendedK.silhouette}
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2">PCA-based Cluster Visualization</h3>
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
                  
                  {[...Array(clusterCount)].map((_, clusterIndex) => {
                    const clusterPoints = scatterData.filter(
                      point => point.cluster === clusterIndex
                    );
                    
                    return (
                      <Scatter
                        key={clusterIndex}
                        name={`Cluster ${clusterIndex}`}
                        data={clusterPoints}
                        fill={CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length]}
                      />
                    );
                  })}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start">
        <div className="text-sm text-muted-foreground">
          <strong>Comparing Methods:</strong> The elbow method minimizes within-cluster variance, while the silhouette method maximizes between-cluster separation.
          <br />
          <strong>Visualization:</strong> The scatter plot shows the clusters identified in the PCA-reduced feature space.
        </div>
      </CardFooter>
    </Card>
  );
};

export default KMeansAnalysis;
