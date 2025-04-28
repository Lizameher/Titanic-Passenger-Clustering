
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ProcessedData, TitanicPassenger } from '@/utils/dataUtils';
import FileUpload from '@/components/FileUpload';
import DataTable from '@/components/DataTable';
import DataPreprocessing from '@/components/DataPreprocessing';
import PCAAnalysis from '@/components/PCAAnalysis';
import KMeansAnalysis from '@/components/KMeansAnalysis';
import ClusterProfiler from '@/components/ClusterProfiler';

const Index = () => {
  const [rawData, setRawData] = useState<TitanicPassenger[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [pcaData, setPcaData] = useState<number[][]>([]);
  const [numPcaComponents, setNumPcaComponents] = useState<number>(2);
  const [originalClusters, setOriginalClusters] = useState<number[]>([]);
  const [pcaClusters, setPcaClusters] = useState<number[]>([]);
  const [clusterCount, setClusterCount] = useState<number>(3);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('data');

  const handleDataLoaded = (data: TitanicPassenger[]) => {
    setRawData(data);
    setProcessedData(null);
    setPcaData([]);
    setOriginalClusters([]);
    setPcaClusters([]);
    setActiveTab('data');
  };

  const handleProcessingComplete = (data: ProcessedData) => {
    setProcessedData(data);
    setActiveTab('pca');
  };

  const handlePcaDataReady = (data: number[][], components: number) => {
    setPcaData(data);
    setNumPcaComponents(components);
  };

  const handleClustersReady = (
    origClusters: number[],
    pcaSpaceClusters: number[],
    k: number
  ) => {
    setOriginalClusters(origClusters);
    setPcaClusters(pcaSpaceClusters);
    setClusterCount(k);
  };

  return (
    <div className="container py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Titanic Passenger Clustering</h1>
        <p className="text-muted-foreground mt-2">
          Explore the Titanic dataset using PCA and K-means clustering
        </p>
      </div>
      
      <div className="grid gap-6">
        {/* Data Upload */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <FileUpload onDataLoaded={handleDataLoaded} isLoading={isLoading} />
          </div>
          
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
                <CardDescription>
                  Analysis workflow and methodology
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col space-y-1">
                    <h3 className="font-medium">Unsupervised Learning Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      This application explores the Titanic dataset using two key unsupervised learning techniques:
                      Principal Component Analysis (PCA) for dimensionality reduction and K-means clustering for 
                      identifying natural groupings among passengers.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">1. Data Preparation</h4>
                      <p className="text-xs text-muted-foreground">
                        Clean and prepare the dataset, handle missing values, 
                        engineer features, and encode categorical variables.
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">2. PCA Analysis</h4>
                      <p className="text-xs text-muted-foreground">
                        Reduce feature dimensions while preserving variance, 
                        visualize data in principal component space.
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">3. K-means Clustering</h4>
                      <p className="text-xs text-muted-foreground">
                        Group passengers into distinct clusters, analyze and interpret 
                        cluster characteristics and survival patterns.
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-2">Getting Started</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Upload the Titanic dataset CSV file or use the example data</li>
                      <li>Process the data to handle missing values and encode features</li>
                      <li>Explore PCA results and select the optimal number of components</li>
                      <li>Run K-means clustering and analyze the resulting passenger segments</li>
                      <li>Compare clusters and interpret their characteristics</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {rawData.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="data">Data Exploration</TabsTrigger>
              <TabsTrigger value="pca" disabled={!processedData}>PCA Analysis</TabsTrigger>
              <TabsTrigger value="kmeans" disabled={!processedData}>K-means Clustering</TabsTrigger>
              <TabsTrigger value="profiles" disabled={originalClusters.length === 0}>Cluster Profiles</TabsTrigger>
            </TabsList>
            
            <TabsContent value="data" className="space-y-6">
              <DataTable data={rawData} />
              <DataPreprocessing 
                data={rawData}
                onProcessingComplete={handleProcessingComplete}
              />
            </TabsContent>
            
            <TabsContent value="pca" className="space-y-6">
              {processedData && (
                <PCAAnalysis
                  processedData={processedData}
                  onPcaDataReady={handlePcaDataReady}
                />
              )}
            </TabsContent>
            
            <TabsContent value="kmeans" className="space-y-6">
              {processedData && (
                <KMeansAnalysis
                  processedData={processedData}
                  pcaData={pcaData}
                  onClustersReady={handleClustersReady}
                />
              )}
            </TabsContent>
            
            <TabsContent value="profiles" className="space-y-6">
              {processedData && originalClusters.length > 0 && (
                <>
                  <ClusterProfiler
                    processedData={processedData}
                    originalClusters={originalClusters}
                    pcaClusters={pcaClusters}
                    clusterCount={clusterCount}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Original Data Clusters</CardTitle>
                        <CardDescription>
                          Data with cluster assignments from original feature space
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <DataTable 
                          data={processedData.original.slice(0, 100)} 
                          clusters={originalClusters.slice(0, 100)}
                        />
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>PCA-based Clusters</CardTitle>
                        <CardDescription>
                          Data with cluster assignments from PCA-reduced space
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <DataTable 
                          data={processedData.original.slice(0, 100)} 
                          clusters={pcaClusters.slice(0, 100)}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Index;
