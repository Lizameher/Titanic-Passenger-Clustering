import { ProcessedData } from '../utils/dataUtils';

// PCA implementation
export const performPCA = (
  data: number[][],
  numComponents?: number
): {
  projectedData: number[][];
  explainedVariance: number[];
  components: number[][];
} => {
  if (data.length === 0 || data[0].length === 0) {
    return { projectedData: [], explainedVariance: [], components: [] };
  }

  // 1. Calculate the mean of each feature
  const n = data.length;
  const d = data[0].length;
  const means = Array(d).fill(0);
  
  data.forEach(row => {
    row.forEach((val, j) => {
      means[j] += val;
    });
  });
  
  means.forEach((sum, j) => {
    means[j] = sum / n;
  });
  
  // 2. Center the data
  const centeredData = data.map(row => 
    row.map((val, j) => val - means[j])
  );
  
  // 3. Compute the covariance matrix
  const covariance = Array(d).fill(0).map(() => Array(d).fill(0));
  
  for (let i = 0; i < d; i++) {
    for (let j = i; j < d; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += centeredData[k][i] * centeredData[k][j];
      }
      covariance[i][j] = sum / (n - 1);
      covariance[j][i] = covariance[i][j]; // Symmetric
    }
  }
  
  // 4. Compute eigenvalues and eigenvectors using power iteration
  const eigenResults = computeEigenvectors(covariance, d);
  
  // Sort by eigenvalue in descending order
  const eigenPairs = eigenResults.eigenvalues
    .map((val, idx) => ({ val, idx }))
    .sort((a, b) => b.val - a.val);
  
  // Calculate total variance and explained variance ratio
  const totalVariance = eigenPairs.reduce((acc, pair) => acc + pair.val, 0);
  
  const explainedVariance = eigenPairs.map(pair => pair.val / totalVariance);
  
  // Determine number of components to keep
  const k = numComponents || d;
  
  // Create matrix of top k eigenvectors
  const components = eigenPairs
    .slice(0, k)
    .map(pair => eigenResults.eigenvectors[pair.idx]);
  
  // Project data onto new dimensions
  const projectedData = centeredData.map(row => {
    return components.map(component => {
      let dotProduct = 0;
      for (let i = 0; i < d; i++) {
        dotProduct += row[i] * component[i];
      }
      return dotProduct;
    });
  });
  
  return { 
    projectedData, 
    explainedVariance: explainedVariance.slice(0, k),
    components
  };
};

// Helper function to compute eigenvectors using power iteration
function computeEigenvectors(
  matrix: number[][],
  numComponents: number
): { eigenvalues: number[]; eigenvectors: number[][] } {
  const n = matrix.length;
  const eigenvalues: number[] = [];
  const eigenvectors: number[][] = [];
  
  // Create a copy of the matrix
  let remainingMatrix = matrix.map(row => [...row]);
  
  // Find eigenvectors one by one
  for (let k = 0; k < numComponents; k++) {
    // Start with a random vector
    let vector = Array(n).fill(0).map(() => Math.random());
    
    // Normalize the vector
    let norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    vector = vector.map(val => val / norm);
    
    // Power iteration (30 iterations should be enough for convergence)
    for (let iter = 0; iter < 30; iter++) {
      // Multiply matrix by vector
      const newVector = Array(n).fill(0);
      
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          newVector[i] += remainingMatrix[i][j] * vector[j];
        }
      }
      
      // Normalize the new vector
      norm = Math.sqrt(newVector.reduce((sum, val) => sum + val * val, 0));
      vector = newVector.map(val => val / norm);
    }
    
    // Calculate the Rayleigh quotient (eigenvalue)
    let eigenvalue = 0;
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        eigenvalue += vector[i] * remainingMatrix[i][j] * vector[j];
      }
    }
    
    eigenvalues.push(eigenvalue);
    eigenvectors.push(vector);
    
    // Deflation (remove the component from the matrix)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        remainingMatrix[i][j] -= eigenvalue * vector[i] * vector[j];
      }
    }
  }
  
  return { eigenvalues, eigenvectors };
}

// K-means clustering implementation
export const performKMeans = (
  data: number[][],
  k: number,
  maxIterations: number = 100
): {
  labels: number[];
  centroids: number[][];
  inertia: number;
} => {
  if (data.length === 0 || data[0].length === 0) {
    return { labels: [], centroids: [], inertia: 0 };
  }

  const n = data.length;
  const d = data[0].length;
  
  // Initialize centroids using k-means++ method
  const centroids = initializeCentroids(data, k);
  
  // Main K-means loop
  let labels = Array(n).fill(0);
  let iterations = 0;
  let changed = true;
  
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    
    // Assign points to nearest centroid
    for (let i = 0; i < n; i++) {
      const point = data[i];
      let minDistance = Infinity;
      let minIndex = 0;
      
      for (let j = 0; j < k; j++) {
        const distance = euclideanDistance(point, centroids[j]);
        
        if (distance < minDistance) {
          minDistance = distance;
          minIndex = j;
        }
      }
      
      if (labels[i] !== minIndex) {
        labels[i] = minIndex;
        changed = true;
      }
    }
    
    // Recalculate centroids
    const newCentroids: number[][] = Array(k).fill(0).map(() => Array(d).fill(0));
    const counts = Array(k).fill(0);
    
    for (let i = 0; i < n; i++) {
      const label = labels[i];
      counts[label]++;
      
      for (let j = 0; j < d; j++) {
        newCentroids[label][j] += data[i][j];
      }
    }
    
    for (let i = 0; i < k; i++) {
      // If a cluster has no points, keep its old centroid
      if (counts[i] > 0) {
        for (let j = 0; j < d; j++) {
          centroids[i][j] = newCentroids[i][j] / counts[i];
        }
      }
    }
  }
  
  // Calculate inertia (sum of squared distances to closest centroid)
  let inertia = 0;
  
  for (let i = 0; i < n; i++) {
    inertia += euclideanDistance(data[i], centroids[labels[i]]);
  }
  
  return { labels, centroids, inertia };
};

// Helper function to initialize centroids using k-means++
function initializeCentroids(data: number[][], k: number): number[][] {
  const n = data.length;
  const d = data[0].length;
  const centroids: number[][] = [];
  
  // Choose first centroid randomly
  const firstIndex = Math.floor(Math.random() * n);
  centroids.push([...data[firstIndex]]);
  
  // Choose remaining centroids
  for (let i = 1; i < k; i++) {
    // Calculate distances to nearest existing centroid
    const distances = data.map(point => {
      let minDistance = Infinity;
      
      for (const centroid of centroids) {
        const distance = euclideanDistance(point, centroid);
        minDistance = Math.min(minDistance, distance);
      }
      
      return minDistance * minDistance; // Square the distance
    });
    
    // Calculate probability distribution
    const sum = distances.reduce((acc, distance) => acc + distance, 0);
    
    if (sum === 0) {
      // If all distances are 0, choose randomly
      const randomIndex = Math.floor(Math.random() * n);
      centroids.push([...data[randomIndex]]);
      continue;
    }
    
    const probabilities = distances.map(distance => distance / sum);
    
    // Choose next centroid based on probability distribution
    let r = Math.random();
    let cumulativeProb = 0;
    let selectedIndex = 0;
    
    for (let j = 0; j < n; j++) {
      cumulativeProb += probabilities[j];
      
      if (r <= cumulativeProb) {
        selectedIndex = j;
        break;
      }
    }
    
    centroids.push([...data[selectedIndex]]);
  }
  
  return centroids;
}

// Helper function to calculate Euclidean distance
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// Calculate silhouette score
export const calculateSilhouetteScore = (
  data: number[][],
  labels: number[]
): number => {
  if (data.length < 2 || new Set(labels).size < 2) {
    return 0;
  }

  const n = data.length;
  let silhouetteSum = 0;
  
  // Calculate silhouette coefficient for each point
  for (let i = 0; i < n; i++) {
    const clusterI = labels[i];
    
    // Calculate average distance to points in same cluster (a)
    let sumIntraCluster = 0;
    let countIntraCluster = 0;
    
    for (let j = 0; j < n; j++) {
      if (i !== j && labels[j] === clusterI) {
        sumIntraCluster += euclideanDistance(data[i], data[j]);
        countIntraCluster++;
      }
    }
    
    const a = countIntraCluster > 0 ? sumIntraCluster / countIntraCluster : 0;
    
    // Calculate average distance to points in the nearest cluster (b)
    let minInterClusterDistance = Infinity;
    
    const uniqueClusters = [...new Set(labels)];
    
    for (const cluster of uniqueClusters) {
      if (cluster === clusterI) continue;
      
      let sumDistances = 0;
      let count = 0;
      
      for (let j = 0; j < n; j++) {
        if (labels[j] === cluster) {
          sumDistances += euclideanDistance(data[i], data[j]);
          count++;
        }
      }
      
      if (count > 0) {
        const avgDistance = sumDistances / count;
        minInterClusterDistance = Math.min(minInterClusterDistance, avgDistance);
      }
    }
    
    const b = minInterClusterDistance === Infinity ? 0 : minInterClusterDistance;
    
    // Calculate silhouette coefficient
    let silhouette = 0;
    
    if (a === 0 && b === 0) {
      silhouette = 0;
    } else if (a === 0) {
      silhouette = 1;
    } else if (b === 0) {
      silhouette = -1;
    } else {
      silhouette = (b - a) / Math.max(a, b);
    }
    
    silhouetteSum += silhouette;
  }
  
  // Return average silhouette score
  return silhouetteSum / n;
};

// Find optimal number of clusters using the elbow method
export const findOptimalK = (
  data: number[][],
  maxK: number = 10,
  method: 'elbow' | 'silhouette' = 'elbow'
): {
  scores: number[];
  recommendedK: number;
} => {
  const scores: number[] = [];
  
  for (let k = 2; k <= maxK; k++) {
    const { labels, inertia } = performKMeans(data, k);
    
    if (method === 'elbow') {
      scores.push(inertia);
    } else {
      const silhouette = calculateSilhouetteScore(data, labels);
      scores.push(silhouette);
    }
  }
  
  // Simple heuristic to recommend K
  let recommendedK = 2;
  
  if (method === 'elbow') {
    // Find elbow point using the second derivative
    const diffs = scores.slice(0, -1).map((val, i) => val - scores[i + 1]);
    const secondDiffs = diffs.slice(0, -1).map((val, i) => val - diffs[i + 1]);
    
    let maxSecondDiff = -Infinity;
    let maxIndex = 0;
    
    secondDiffs.forEach((diff, i) => {
      if (diff > maxSecondDiff) {
        maxSecondDiff = diff;
        maxIndex = i;
      }
    });
    
    recommendedK = maxIndex + 2;
  } else {
    // Find k with maximum silhouette score
    let maxSilhouette = -Infinity;
    let maxIndex = 0;
    
    scores.forEach((score, i) => {
      if (score > maxSilhouette) {
        maxSilhouette = score;
        maxIndex = i;
      }
    });
    
    recommendedK = maxIndex + 2;
  }
  
  return { scores, recommendedK };
};
