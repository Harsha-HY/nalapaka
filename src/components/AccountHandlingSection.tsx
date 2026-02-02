import { useState } from 'react';
import { Plus, User, Trash2, Edit, Phone, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useServers, Server } from '@/hooks/useServers';

const ALL_TABLES = Array.from({ length: 20 }, (_, i) => String(i + 1));

export function AccountHandlingSection() {
  const { servers, createServerAccount, updateServer, deleteServer, isLoading } = useServers();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    assignedTables: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddServer = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.assignedTables.length === 0) {
      toast.error('Please assign at least one table');
      return;
    }

    setIsSubmitting(true);
    try {
      await createServerAccount(
        formData.email,
        formData.password,
        formData.name,
        formData.phoneNumber,
        formData.assignedTables
      );
      toast.success(`Server "${formData.name}" created successfully`);
      setShowAddModal(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateServer = async () => {
    if (!editingServer) return;

    setIsSubmitting(true);
    try {
      await updateServer(editingServer.id, {
        name: formData.name,
        phone_number: formData.phoneNumber,
        assigned_tables: formData.assignedTables,
      });
      toast.success('Server updated successfully');
      setShowEditModal(false);
      setEditingServer(null);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteServer = async (server: Server) => {
    if (!confirm(`Are you sure you want to delete server "${server.name}"?`)) return;

    try {
      await deleteServer(server.id);
      toast.success('Server deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete server');
    }
  };

  const handleEditClick = (server: Server) => {
    setEditingServer(server);
    setFormData({
      name: server.name,
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: server.phone_number || '',
      assignedTables: server.assigned_tables,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      assignedTables: [],
    });
  };

  const toggleTable = (table: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTables: prev.assignedTables.includes(table)
        ? prev.assignedTables.filter(t => t !== table)
        : [...prev.assignedTables, table],
    }));
  };

  // Get tables already assigned to other servers
  const getAssignedTables = (excludeServerId?: string) => {
    return servers
      .filter(s => s.id !== excludeServerId)
      .flatMap(s => s.assigned_tables);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Account Handling</h2>
        <Button onClick={() => setShowAddModal(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Server
        </Button>
      </div>

      {/* Servers List */}
      {servers.length === 0 ? (
        <Card className="shadow-soft border-0">
          <CardContent className="py-8 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No servers created yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Add Server" to create a server account
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {servers.map((server) => (
            <Card key={server.id} className="shadow-soft border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {server.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(server)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteServer(server)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {server.phone_number && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {server.phone_number}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Table className="h-3 w-3 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {server.assigned_tables.length > 0 ? (
                      server.assigned_tables.map((table) => (
                        <Badge key={table} variant="secondary" className="text-xs">
                          Table {table}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No tables assigned</span>
                    )}
                  </div>
                </div>
                <Badge variant={server.is_active ? 'default' : 'secondary'} className="mt-2">
                  {server.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Server Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Server</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Server Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Ramesh"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (for login) *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="server@restaurant.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="9876543210"
              />
            </div>
            <div className="space-y-2">
              <Label>Assign Tables *</Label>
              <div className="grid grid-cols-5 gap-2 p-3 bg-secondary/30 rounded-lg">
                {ALL_TABLES.map((table) => {
                  const isAssigned = getAssignedTables().includes(table);
                  return (
                    <div key={table} className="flex items-center space-x-1">
                      <Checkbox
                        id={`table-${table}`}
                        checked={formData.assignedTables.includes(table)}
                        disabled={isAssigned}
                        onCheckedChange={() => toggleTable(table)}
                      />
                      <label
                        htmlFor={`table-${table}`}
                        className={`text-sm cursor-pointer ${isAssigned ? 'text-muted-foreground line-through' : ''}`}
                      >
                        {table}
                      </label>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Strikethrough tables are already assigned to other servers
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddServer} 
              disabled={isSubmitting || !formData.name || !formData.email || !formData.password}
            >
              {isSubmitting ? 'Creating...' : 'Create Server'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Server Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Server</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Server Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Assign Tables *</Label>
              <div className="grid grid-cols-5 gap-2 p-3 bg-secondary/30 rounded-lg">
                {ALL_TABLES.map((table) => {
                  const isAssigned = getAssignedTables(editingServer?.id).includes(table);
                  return (
                    <div key={table} className="flex items-center space-x-1">
                      <Checkbox
                        id={`edit-table-${table}`}
                        checked={formData.assignedTables.includes(table)}
                        disabled={isAssigned}
                        onCheckedChange={() => toggleTable(table)}
                      />
                      <label
                        htmlFor={`edit-table-${table}`}
                        className={`text-sm cursor-pointer ${isAssigned ? 'text-muted-foreground line-through' : ''}`}
                      >
                        {table}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditModal(false); setEditingServer(null); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateServer} 
              disabled={isSubmitting || !formData.name}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
