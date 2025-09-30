
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, PlusCircle } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import type { Tenant } from './schema';
import { TenantProfileDialog } from '@/components/tenant-profile-dialog';
import { NewTenantDialog } from '@/components/new-tenant-dialog';

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [isNewTenantDialogOpen, setNewTenantDialogOpen] = useState(false);

    const fetchTenants = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/tenants'); 
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch tenants');
            }
            setTenants(data.tenants);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);
    
    const handleDialogClose = () => {
        setSelectedTenant(null);
    }

    const memoizedColumns = useMemo(() => columns({ onSelectTenant: setSelectedTenant }), []);

    const isCredentialError = error && (error.includes('credential') || error.includes('FIREBASE_PROJECT_ID'));

  return (
    <div className="flex-1 space-y-4">
        <NewTenantDialog
            isOpen={isNewTenantDialogOpen}
            onOpenChange={setNewTenantDialogOpen}
            onTenantCreated={fetchTenants}
        />
        <TenantProfileDialog 
            tenant={selectedTenant}
            isOpen={!!selectedTenant}
            onOpenChange={handleDialogClose}
            onTenantUpdated={fetchTenants}
        />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Tenant Management</h1>
        <Button className="bg-accent hover:bg-accent/90" onClick={() => setNewTenantDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Tenant
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Client Tenants</CardTitle>
          <CardDescription>
            This is a list of your client tenants who can access the client portal. Click a row to view details.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {error && (
                 <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{isCredentialError ? 'Configuration Required' : 'Error Fetching Data'}</AlertTitle>
                    <AlertDescription>
                        {error}
                        {isCredentialError && (
                            <p className="mt-2">Please ensure your Firebase Admin credentials are set in your .env file.</p>
                        )}
                    </AlertDescription>
                </Alert>
            )}
           {loading ? (
             <p>Loading tenants...</p>
           ) : (
            <DataTable 
                columns={memoizedColumns} 
                data={tenants}
                onRowClick={(row) => setSelectedTenant(row.original)}
            />
           )}
        </CardContent>
      </Card>
    </div>
  );
}
