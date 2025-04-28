# Titanic Passenger Clustering Analysis

An interactive web application for analyzing the Titanic dataset using unsupervised machine learning techniques, specifically Principal Component Analysis (PCA) and K-means clustering.
Screensort : 
![Screenshot 2025-04-28 192111](https://github.com/user-attachments/assets/333b732a-322c-4289-9aaf-81fbd1869cc9)
![Screenshot 2025-04-28 192508](https://github.com/user-attachments/assets/1b7b6cdf-b9ea-43ab-85ed-aae6024d3d67)
![Screenshot 2025-04-28 192629](https://github.com/user-attachments/assets/09ae5f92-ac24-41c4-a043-0f47737addef)
![Screenshot 2025-04-28 192659](https://github.com/user-attachments/assets/c0537489-c113-49f9-9c88-6b3a340f09a8)
![Screenshot 2025-04-28 192730](https://github.com/user-attachments/assets/ecc00d99-f1b0-4962-a9cb-91a5d137be5f)

## Features

- **Data Upload and Processing**
  - CSV file upload functionality
  - Automatic data preprocessing and feature engineering
  - Handling of missing values and categorical features

- **Principal Component Analysis (PCA)**
  - Dimensionality reduction visualization
  - Interactive variance explanation charts
  - Adjustable number of components

- **K-means Clustering**
  - Interactive elbow method analysis
  - Silhouette score visualization
  - Customizable number of clusters (K)
  - PCA-based cluster visualization

- **Cluster Analysis**
  - Detailed cluster profiling
  - Survival rate analysis per cluster
  - Interactive data visualization

## Technology Stack

- **Frontend Framework**: React with TypeScript
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Data Visualization**: Recharts
- **State Management**: React Query
- **Build Tool**: Vite

## Getting Started

1. Clone the repository
```sh
git clone <repository-url>
cd titanic-clustering
```

2. Install dependencies
```sh
npm install
```

3. Start the development server
```sh
npm run dev
```

## Usage

1. **Upload Data**
   - Click on the upload button to load your Titanic dataset (CSV format)
   - The application will automatically preprocess the data

2. **Explore PCA**
   - View the explained variance ratio
   - Adjust the number of components
   - Visualize the data in reduced dimensions

3. **Perform Clustering**
   - Use the elbow method to find optimal K
   - Alternative: Use silhouette analysis
   - Adjust the number of clusters manually
   - View cluster assignments in PCA space

4. **Analyze Results**
   - Examine cluster profiles
   - Compare clustering results
   - View survival rates per cluster

## Data Format

The application expects a CSV file with the following Titanic dataset columns:
- PassengerId
- Survived
- Pclass
- Name
- Sex
- Age
- SibSp
- Parch
- Ticket
- Fare
- Cabin
- Embarked

