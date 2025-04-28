
// Data types for Titanic dataset
export interface TitanicPassenger {
  PassengerId?: number;
  Survived?: number;
  Pclass?: number;
  Name?: string;
  Sex?: string;
  Age?: number;
  SibSp?: number;
  Parch?: number;
  Ticket?: string;
  Fare?: number;
  Cabin?: string;
  Embarked?: string;
  [key: string]: any; // For dynamic access
}

export interface ProcessedData {
  original: TitanicPassenger[];
  processed: number[][];
  features: string[];
  categoricalFeatures: string[];
  numericalFeatures: string[];
  survivedColumn?: number[];
}

// Helper function to parse CSV
export const parseCSV = (csvText: string): TitanicPassenger[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  return lines.slice(1).map(line => {
    // Handle quoted fields properly
    const values: string[] = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    values.push(currentValue); // Add the last value
    
    const passenger: TitanicPassenger = {};
    headers.forEach((header, index) => {
      const value = values[index]?.replace(/^"|"$/g, '') || '';
      
      // Convert to appropriate types
      if (header === 'PassengerId' || header === 'Survived' || header === 'Pclass' || header === 'SibSp' || header === 'Parch') {
        passenger[header] = value === '' ? null : parseInt(value, 10);
      } else if (header === 'Age' || header === 'Fare') {
        passenger[header] = value === '' ? null : parseFloat(value);
      } else {
        passenger[header] = value;
      }
    });
    
    return passenger;
  });
};

// Feature engineering function
export const engineerFeatures = (data: TitanicPassenger[]): TitanicPassenger[] => {
  return data.map(passenger => {
    const enhanced = { ...passenger };
    
    // Calculate family size
    enhanced.FamilySize = (passenger.SibSp || 0) + (passenger.Parch || 0) + 1;
    
    // Extract title from name
    if (passenger.Name) {
      const match = passenger.Name.match(/,\s*([^\s\.]+)\./);
      enhanced.Title = match ? match[1] : 'Unknown';
    }
    
    // Create HasCabin feature
    enhanced.HasCabin = passenger.Cabin && passenger.Cabin !== '' ? 1 : 0;
    
    return enhanced;
  });
};

// Separate features and target
export const separateFeatures = (
  data: TitanicPassenger[]
): { 
  features: TitanicPassenger[]; 
  survived?: number[]; 
} => {
  const features = data.map(passenger => {
    const { Survived, ...rest } = passenger;
    return rest;
  });
  
  const survived = data.map(passenger => passenger.Survived || 0);
  
  return {
    features,
    survived
  };
};

// Identify numerical and categorical features
export const identifyFeatureTypes = (
  data: TitanicPassenger[]
): {
  numericalFeatures: string[];
  categoricalFeatures: string[];
} => {
  if (data.length === 0) return { numericalFeatures: [], categoricalFeatures: [] };
  
  const samplePassenger = data[0];
  const numericalFeatures: string[] = [];
  const categoricalFeatures: string[] = [];
  
  // Features to exclude completely
  const excludeFeatures = ['PassengerId', 'Name', 'Ticket', 'Cabin', 'Survived'];
  
  for (const feature in samplePassenger) {
    if (excludeFeatures.includes(feature)) continue;
    
    const value = samplePassenger[feature];
    if (typeof value === 'number') {
      numericalFeatures.push(feature);
    } else {
      categoricalFeatures.push(feature);
    }
  }
  
  return { numericalFeatures, categoricalFeatures };
};

// Simple imputation for missing values
export const imputeMissingValues = (data: TitanicPassenger[]): TitanicPassenger[] => {
  // First, calculate medians and modes
  const medians: Record<string, number> = {};
  const modes: Record<string, any> = {};
  
  const { numericalFeatures, categoricalFeatures } = identifyFeatureTypes(data);
  
  // Calculate medians for numerical features
  numericalFeatures.forEach(feature => {
    const validValues = data
      .map(p => p[feature])
      .filter(v => v !== null && v !== undefined) as number[];
      
    if (validValues.length > 0) {
      // Sort and find median
      validValues.sort((a, b) => a - b);
      const mid = Math.floor(validValues.length / 2);
      medians[feature] = validValues.length % 2 === 0
        ? (validValues[mid - 1] + validValues[mid]) / 2
        : validValues[mid];
    } else {
      medians[feature] = 0;
    }
  });
  
  // Calculate modes for categorical features
  categoricalFeatures.forEach(feature => {
    const valueCounts: Record<string, number> = {};
    
    data.forEach(passenger => {
      const value = passenger[feature];
      if (value !== null && value !== undefined && value !== '') {
        valueCounts[value as string] = (valueCounts[value as string] || 0) + 1;
      }
    });
    
    let maxCount = 0;
    let modeValue = '';
    
    Object.entries(valueCounts).forEach(([value, count]) => {
      if (count > maxCount) {
        maxCount = count;
        modeValue = value;
      }
    });
    
    modes[feature] = modeValue;
  });
  
  // Apply imputation
  return data.map(passenger => {
    const imputed = { ...passenger };
    
    numericalFeatures.forEach(feature => {
      if (imputed[feature] === null || imputed[feature] === undefined) {
        imputed[feature] = medians[feature];
      }
    });
    
    categoricalFeatures.forEach(feature => {
      if (imputed[feature] === null || imputed[feature] === undefined || imputed[feature] === '') {
        imputed[feature] = modes[feature];
      }
    });
    
    return imputed;
  });
};

// One-hot encode categorical features
export const oneHotEncodeCategorical = (
  data: TitanicPassenger[],
  categoricalFeatures: string[]
): {
  encodedData: number[][];
  features: string[];
} => {
  const features: string[] = [];
  
  // Find all possible categorical values
  const categoricalValues: Record<string, Set<string>> = {};
  
  categoricalFeatures.forEach(feature => {
    categoricalValues[feature] = new Set();
    
    data.forEach(passenger => {
      const value = passenger[feature];
      if (value !== null && value !== undefined && value !== '') {
        categoricalValues[feature].add(value as string);
      }
    });
  });
  
  // Create feature names for one-hot encoding
  const { numericalFeatures } = identifyFeatureTypes(data);
  
  // Add numerical features first
  numericalFeatures.forEach(feature => {
    features.push(feature);
  });
  
  // Add categorical features (one-hot encoded)
  categoricalFeatures.forEach(feature => {
    categoricalValues[feature].forEach(value => {
      features.push(`${feature}_${value}`);
    });
  });
  
  // Create the encoded data matrix
  const encodedData: number[][] = data.map(passenger => {
    const row: number[] = [];
    
    // Add numerical features
    numericalFeatures.forEach(feature => {
      row.push(passenger[feature] as number);
    });
    
    // Add categorical features (one-hot encoded)
    categoricalFeatures.forEach(feature => {
      categoricalValues[feature].forEach(value => {
        row.push(passenger[feature] === value ? 1 : 0);
      });
    });
    
    return row;
  });
  
  return { encodedData, features };
};

// Standardize numerical features
export const standardizeData = (data: number[][]): number[][] => {
  if (data.length === 0 || data[0].length === 0) return [];
  
  const numFeatures = data[0].length;
  const means: number[] = Array(numFeatures).fill(0);
  const stds: number[] = Array(numFeatures).fill(0);
  
  // Calculate means
  data.forEach(row => {
    row.forEach((val, i) => {
      means[i] += val;
    });
  });
  
  means.forEach((sum, i) => {
    means[i] = sum / data.length;
  });
  
  // Calculate standard deviations
  data.forEach(row => {
    row.forEach((val, i) => {
      stds[i] += Math.pow(val - means[i], 2);
    });
  });
  
  stds.forEach((sum, i) => {
    stds[i] = Math.sqrt(sum / data.length);
    // Avoid division by zero
    if (stds[i] === 0) stds[i] = 1;
  });
  
  // Standardize data
  return data.map(row => {
    return row.map((val, i) => (val - means[i]) / stds[i]);
  });
};

// Full preprocessing pipeline
export const preprocessData = (rawData: TitanicPassenger[]): ProcessedData => {
  // Engineer features
  const enhancedData = engineerFeatures(rawData);
  
  // Separate features and target
  const { features, survived } = separateFeatures(enhancedData);
  
  // Identify feature types
  const { numericalFeatures, categoricalFeatures } = identifyFeatureTypes(features);
  
  // Impute missing values
  const imputedData = imputeMissingValues(features);
  
  // One-hot encode categorical features
  const { encodedData, features: allFeatures } = oneHotEncodeCategorical(
    imputedData,
    categoricalFeatures
  );
  
  // Standardize numerical data
  const standardizedData = standardizeData(encodedData);
  
  return {
    original: rawData,
    processed: standardizedData,
    features: allFeatures,
    categoricalFeatures,
    numericalFeatures,
    survivedColumn: survived
  };
};

// Utility functions for cluster analysis
export const getClusterProfiles = (
  data: TitanicPassenger[],
  clusters: number[]
): Record<string, any> => {
  const uniqueClusters = [...new Set(clusters)];
  const profiles: Record<string, any> = {};
  
  uniqueClusters.forEach(cluster => {
    const clusterPassengers = data.filter((_, i) => clusters[i] === cluster);
    
    const profile: Record<string, any> = {};
    
    // Get first passenger to identify features
    if (clusterPassengers.length === 0) return;
    
    const firstPassenger = clusterPassengers[0];
    
    for (const feature in firstPassenger) {
      if (typeof firstPassenger[feature] === 'number') {
        // Calculate average for numerical features
        const sum = clusterPassengers.reduce(
          (acc, p) => acc + (p[feature] as number || 0), 
          0
        );
        profile[feature] = sum / clusterPassengers.length;
      } else {
        // Calculate mode for categorical features
        const valueCounts: Record<string, number> = {};
        
        clusterPassengers.forEach(passenger => {
          const value = String(passenger[feature] || '');
          valueCounts[value] = (valueCounts[value] || 0) + 1;
        });
        
        let maxCount = 0;
        let modeValue = '';
        
        Object.entries(valueCounts).forEach(([value, count]) => {
          if (count > maxCount) {
            maxCount = count;
            modeValue = value;
          }
        });
        
        profile[feature] = modeValue;
      }
    }
    
    profiles[cluster] = profile;
  });
  
  return profiles;
};

// Calculate survival rates per cluster
export const getClusterSurvivalRates = (
  survived: number[] | undefined,
  clusters: number[]
): Record<number, number> => {
  if (!survived) return {};
  
  const uniqueClusters = [...new Set(clusters)];
  const survivalRates: Record<number, number> = {};
  
  uniqueClusters.forEach(cluster => {
    const clusterSurvived = survived.filter((s, i) => clusters[i] === cluster);
    
    if (clusterSurvived.length === 0) {
      survivalRates[cluster] = 0;
    } else {
      const survivedCount = clusterSurvived.reduce((acc, s) => acc + s, 0);
      survivalRates[cluster] = survivedCount / clusterSurvived.length;
    }
  });
  
  return survivalRates;
};
