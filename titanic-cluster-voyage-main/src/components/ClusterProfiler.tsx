
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { getClusterProfiles, getClusterSurvivalRates, ProcessedData, TitanicPassenger } from '@/utils/dataUtils';

interface ClusterProfilerProps {
  processedData: ProcessedData;
  originalClusters: number[];
  pcaClusters: number[];
  clusterCount: number;
}

const ClusterProfiler = ({
  processedData,
  originalClusters,
  pcaClusters,
  clusterCount
}: ClusterProfilerProps) => {
  const [activeTab, setActiveTab] = useState<string>('original');
  const [originalProfiles, setOriginalProfiles] = useState<Record<string, any>>({});
  const [pcaProfiles, setPcaProfiles] = useState<Record<string, any>>({});
  const [originalSurvival, setOriginalSurvival] = useState<Record<number, number>>({});
  const [pcaSurvival, setPcaSurvival] = useState<Record<number, number>>({});
  const [selectedCluster, setSelectedCluster] = useState<number>(0);
  
  // Process cluster profiles when clusters change
  useEffect(() => {
    if (
      !processedData.original || 
      processedData.original.length === 0 ||
      originalClusters.length === 0
    ) {
      return;
    }
    
    // Get profiles for original clusters
    const origProfiles = getClusterProfiles(
      processedData.original,
      originalClusters
    );
    setOriginalProfiles(origProfiles);
    
    // Get survival rates for original clusters
    const origSurvival = getClusterSurvivalRates(
      processedData.survivedColumn,
      originalClusters
    );
    setOriginalSurvival(origSurvival);
    
    // Get profiles for PCA clusters if available
    if (pcaClusters && pcaClusters.length > 0) {
      const pcaClusterProfiles = getClusterProfiles(
        processedData.original,
        pcaClusters
      );
      setPcaProfiles(pcaClusterProfiles);
      
      // Get survival rates for PCA clusters
      const pcaSurvivalRates = getClusterSurvivalRates(
        processedData.survivedColumn,
        pcaClusters
      );
      setPcaSurvival(pcaSurvivalRates);
    }
    
  }, [processedData, originalClusters, pcaClusters]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // Convert profiles to chart data
  const getNumericalProfileData = (profiles: Record<string, any>, featureKey: string) => {
    return Object.entries(profiles).map(([cluster, profile]) => ({
      cluster: `Cluster ${cluster}`,
      value: profile[featureKey]
    }));
  };
  
  const getCategoricalProfileData = (
    data: TitanicPassenger[],
    clusters: number[],
    featureKey: string
  ) => {
    // Count occurrences of each category in each cluster
    const categoryCounts: Record<number, Record<string, number>> = {};
    
    for (let i = 0; i < data.length; i++) {
      const cluster = clusters[i];
      const value = String(data[i][featureKey] || '');
      
      if (!categoryCounts[cluster]) {
        categoryCounts[cluster] = {};
      }
      
      categoryCounts[cluster][value] = (categoryCounts[cluster][value] || 0) + 1;
    }
    
    // Calculate percentages for each cluster
    const result: Record<number, Record<string, number>> = {};
    
    Object.entries(categoryCounts).forEach(([cluster, counts]) => {
      const clusterNum = parseInt(cluster, 10);
      result[clusterNum] = {};
      
      const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      
      Object.entries(counts).forEach(([category, count]) => {
        result[clusterNum][category] = count / total;
      });
    });
    
    return result;
  };
  
  const getSurvivalData = (survivalRates: Record<number, number>) => {
    return Object.entries(survivalRates).map(([cluster, rate]) => ({
      name: `Cluster ${cluster}`,
      value: rate * 100
    }));
  };
  
  const currentProfiles = activeTab === 'original' ? originalProfiles : pcaProfiles;
  const currentClusters = activeTab === 'original' ? originalClusters : pcaClusters;
  const currentSurvival = activeTab === 'original' ? originalSurvival : pcaSurvival;
  
  const ageData = currentProfiles && Object.keys(currentProfiles).length > 0
    ? getNumericalProfileData(currentProfiles, 'Age')
    : [];
    
  const fareData = currentProfiles && Object.keys(currentProfiles).length > 0
    ? getNumericalProfileData(currentProfiles, 'Fare')
    : [];
    
  const familySizeData = currentProfiles && Object.keys(currentProfiles).length > 0
    ? getNumericalProfileData(currentProfiles, 'FamilySize')
    : [];
    
  const sexData = processedData.original && currentClusters.length > 0
    ? getCategoricalProfileData(processedData.original, currentClusters, 'Sex')
    : {};
  
  const pclassData = processedData.original && currentClusters.length > 0
    ? getCategoricalProfileData(processedData.original, currentClusters, 'Pclass')
    : {};
    
  const survivedData = getSurvivalData(currentSurvival);
  
  const COLORS = [
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
        <CardTitle>Cluster Profiling</CardTitle>
        <CardDescription>
          Analyze the characteristics of each identified cluster
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="original" value={activeTab} onValueChange={handleTabChange}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="original">Original Space Clusters</TabsTrigger>
              <TabsTrigger value="pca">PCA Space Clusters</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm">Select Cluster:</label>
              <select
                value={selectedCluster}
                onChange={(e) => setSelectedCluster(parseInt(e.target.value))}
                className="text-sm border rounded p-1"
              >
                {[...Array(clusterCount)].map((_, i) => (
                  <option key={i} value={i}>Cluster {i}</option>
                ))}
              </select>
            </div>
          </div>
          
          <TabsContent value="original">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Numerical Features */}
              <div>
                <h3 className="text-md font-medium mb-2">Numerical Features</h3>
                <div className="chart-container h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[ageData[selectedCluster], fareData[selectedCluster], familySizeData[selectedCluster]]}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis
                        type="category"
                        dataKey="feature"
                        width={80}
                      />
                      <Tooltip formatter={(value: any) => value.toFixed(2)} />
                      <Bar
                        dataKey="value"
                        fill="hsl(var(--primary))"
                        name="Average Value"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Sex Distribution */}
              <div>
                <h3 className="text-md font-medium mb-2">Sex Distribution</h3>
                <div className="chart-container h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sexData[selectedCluster] ? [
                          { name: "Male", value: sexData[selectedCluster].male || 0 },
                          { name: "Female", value: sexData[selectedCluster].female || 0 }
                        ] : []}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {sexData[selectedCluster] ? [
                          { name: "Male", value: sexData[selectedCluster].male || 0 },
                          { name: "Female", value: sexData[selectedCluster].female || 0 }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        )) : null}
                      </Pie>
                      <Tooltip formatter={(value: any) => `${(value * 100).toFixed(1)}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Passenger Class */}
              <div>
                <h3 className="text-md font-medium mb-2">Passenger Class</h3>
                <div className="chart-container h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pclassData[selectedCluster] ? [
                          { name: "1st Class", value: pclassData[selectedCluster]['1'] || 0 },
                          { name: "2nd Class", value: pclassData[selectedCluster]['2'] || 0 },
                          { name: "3rd Class", value: pclassData[selectedCluster]['3'] || 0 }
                        ] : []}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="hsl(var(--secondary))"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pclassData[selectedCluster] ? [
                          { name: "1st Class", value: pclassData[selectedCluster]['1'] || 0 },
                          { name: "2nd Class", value: pclassData[selectedCluster]['2'] || 0 },
                          { name: "3rd Class", value: pclassData[selectedCluster]['3'] || 0 }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        )) : null}
                      </Pie>
                      <Tooltip formatter={(value: any) => `${(value * 100).toFixed(1)}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Survival Rate */}
              <div>
                <h3 className="text-md font-medium mb-2">Survival Rate</h3>
                <div className="chart-container h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[survivedData[selectedCluster]]}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={80}
                      />
                      <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
                      <Bar
                        dataKey="value"
                        fill="hsl(var(--accent))"
                        name="Survival Rate (%)"
                      >
                        <Cell fill="hsl(var(--accent))" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Cluster Summary</h3>
              <div className="bg-muted p-4 rounded-md">
                {currentProfiles[selectedCluster] && (
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Age:</strong> {currentProfiles[selectedCluster].Age?.toFixed(1)} years (average)</li>
                    <li><strong>Fare:</strong> ${currentProfiles[selectedCluster].Fare?.toFixed(2)} (average)</li>
                    <li><strong>Family Size:</strong> {currentProfiles[selectedCluster].FamilySize?.toFixed(1)} people (average)</li>
                    <li><strong>Gender:</strong> {sexData[selectedCluster]?.male > sexData[selectedCluster]?.female ? 
                      `Predominantly male (${(sexData[selectedCluster].male * 100).toFixed(0)}%)` : 
                      `Predominantly female (${(sexData[selectedCluster].female * 100).toFixed(0)}%)`}</li>
                    <li><strong>Class:</strong> Mainly {
                      pclassData[selectedCluster] ? 
                      (() => {
                        const classes = ['1', '2', '3'];
                        const maxClass = classes.reduce((max, curr) => 
                          (pclassData[selectedCluster][curr] || 0) > (pclassData[selectedCluster][max] || 0) ? curr : max
                        , '1');
                        return `${maxClass}${maxClass === '1' ? 'st' : maxClass === '2' ? 'nd' : 'rd'} class (${(pclassData[selectedCluster][maxClass] * 100).toFixed(0)}%)`;
                      })() : 'Unknown'
                    }</li>
                    <li><strong>Survival Rate:</strong> {currentSurvival[selectedCluster] ? 
                      `${(currentSurvival[selectedCluster] * 100).toFixed(1)}%` : 'Unknown'}</li>
                  </ul>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="pca">
            {/* Same structure as above, but with PCA cluster data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Numerical Features */}
              <div>
                <h3 className="text-md font-medium mb-2">Numerical Features</h3>
                <div className="chart-container h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[ageData[selectedCluster], fareData[selectedCluster], familySizeData[selectedCluster]]}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis
                        type="category"
                        dataKey="feature"
                        width={80}
                      />
                      <Tooltip formatter={(value: any) => value.toFixed(2)} />
                      <Bar
                        dataKey="value"
                        fill="hsl(var(--primary))"
                        name="Average Value"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Sex Distribution */}
              <div>
                <h3 className="text-md font-medium mb-2">Sex Distribution</h3>
                <div className="chart-container h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sexData[selectedCluster] ? [
                          { name: "Male", value: sexData[selectedCluster].male || 0 },
                          { name: "Female", value: sexData[selectedCluster].female || 0 }
                        ] : []}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {sexData[selectedCluster] ? [
                          { name: "Male", value: sexData[selectedCluster].male || 0 },
                          { name: "Female", value: sexData[selectedCluster].female || 0 }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        )) : null}
                      </Pie>
                      <Tooltip formatter={(value: any) => `${(value * 100).toFixed(1)}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Passenger Class */}
              <div>
                <h3 className="text-md font-medium mb-2">Passenger Class</h3>
                <div className="chart-container h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pclassData[selectedCluster] ? [
                          { name: "1st Class", value: pclassData[selectedCluster]['1'] || 0 },
                          { name: "2nd Class", value: pclassData[selectedCluster]['2'] || 0 },
                          { name: "3rd Class", value: pclassData[selectedCluster]['3'] || 0 }
                        ] : []}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="hsl(var(--secondary))"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pclassData[selectedCluster] ? [
                          { name: "1st Class", value: pclassData[selectedCluster]['1'] || 0 },
                          { name: "2nd Class", value: pclassData[selectedCluster]['2'] || 0 },
                          { name: "3rd Class", value: pclassData[selectedCluster]['3'] || 0 }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        )) : null}
                      </Pie>
                      <Tooltip formatter={(value: any) => `${(value * 100).toFixed(1)}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Survival Rate */}
              <div>
                <h3 className="text-md font-medium mb-2">Survival Rate</h3>
                <div className="chart-container h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[survivedData[selectedCluster]]}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={80}
                      />
                      <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
                      <Bar
                        dataKey="value"
                        fill="hsl(var(--accent))"
                        name="Survival Rate (%)"
                      >
                        <Cell fill="hsl(var(--accent))" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Cluster Summary</h3>
              <div className="bg-muted p-4 rounded-md">
                {currentProfiles[selectedCluster] && (
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Age:</strong> {currentProfiles[selectedCluster].Age?.toFixed(1)} years (average)</li>
                    <li><strong>Fare:</strong> ${currentProfiles[selectedCluster].Fare?.toFixed(2)} (average)</li>
                    <li><strong>Family Size:</strong> {currentProfiles[selectedCluster].FamilySize?.toFixed(1)} people (average)</li>
                    <li><strong>Gender:</strong> {sexData[selectedCluster]?.male > sexData[selectedCluster]?.female ? 
                      `Predominantly male (${(sexData[selectedCluster].male * 100).toFixed(0)}%)` : 
                      `Predominantly female (${(sexData[selectedCluster].female * 100).toFixed(0)}%)`}</li>
                    <li><strong>Class:</strong> Mainly {
                      pclassData[selectedCluster] ? 
                      (() => {
                        const classes = ['1', '2', '3'];
                        const maxClass = classes.reduce((max, curr) => 
                          (pclassData[selectedCluster][curr] || 0) > (pclassData[selectedCluster][max] || 0) ? curr : max
                        , '1');
                        return `${maxClass}${maxClass === '1' ? 'st' : maxClass === '2' ? 'nd' : 'rd'} class (${(pclassData[selectedCluster][maxClass] * 100).toFixed(0)}%)`;
                      })() : 'Unknown'
                    }</li>
                    <li><strong>Survival Rate:</strong> {currentSurvival[selectedCluster] ? 
                      `${(currentSurvival[selectedCluster] * 100).toFixed(1)}%` : 'Unknown'}</li>
                  </ul>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ClusterProfiler;
