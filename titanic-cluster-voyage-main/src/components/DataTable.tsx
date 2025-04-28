
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TitanicPassenger } from '@/utils/dataUtils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableProps {
  data: TitanicPassenger[];
  clusters?: number[];
}

const DataTable = ({ data, clusters }: DataTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(data.length / rowsPerPage);
  
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, data.length);
  const currentData = data.slice(startIndex, endIndex);

  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  const handlePreviousPage = () => {
    setCurrentPage(curr => Math.max(curr - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(curr => Math.min(curr + 1, totalPages));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dataset Preview</CardTitle>
        <CardDescription>
          Preview of the Titanic passenger data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full">
          <div className="data-table">
            <Table>
              <TableHeader>
                <TableRow>
                  {clusters && <TableHead className="w-12">Cluster</TableHead>}
                  {headers.map(header => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {clusters && (
                      <TableCell>
                        <span 
                          className="inline-block w-6 h-6 rounded-full text-white text-xs font-medium flex items-center justify-center"
                          style={{ 
                            backgroundColor: 
                              clusters[startIndex + rowIndex] === 0 ? 'hsl(var(--primary))' : 
                              clusters[startIndex + rowIndex] === 1 ? 'hsl(var(--secondary))' : 
                              clusters[startIndex + rowIndex] === 2 ? 'hsl(var(--accent))' :
                              `hsl(${clusters[startIndex + rowIndex] * 60}, 70%, 50%)`
                          }}
                        >
                          {clusters[startIndex + rowIndex]}
                        </span>
                      </TableCell>
                    )}
                    {headers.map(header => (
                      <TableCell key={`${rowIndex}-${header}`}>
                        {row[header] !== null && row[header] !== undefined 
                          ? String(row[header])
                          : ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
        
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
            <span className="font-medium">{endIndex}</span> of{" "}
            <span className="font-medium">{data.length}</span> entries
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataTable;
