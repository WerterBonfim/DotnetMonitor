import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postgresqlApi } from '../../services/postgresqlApi';
import type { PostgresConnection, CreateConnectionRequest } from '../../types/postgresql';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Trash2, Star } from 'lucide-react';
import { toast } from '../ui/toaster';

export function ConnectionsManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [_selectedConnection, setSelectedConnection] = useState<PostgresConnection | null>(null);

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['postgresql-connections'],
    queryFn: () => postgresqlApi.getConnections(),
  });

  const createMutation = useMutation({
    mutationFn: (connection: CreateConnectionRequest) => postgresqlApi.saveConnection(connection),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postgresql-connections'] });
      setShowForm(false);
      toast({
        title: 'Sucesso',
        description: 'Conexão salva com sucesso!',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar conexão',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => postgresqlApi.deleteConnection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postgresql-connections'] });
      toast({
        title: 'Sucesso',
        description: 'Conexão excluída com sucesso!',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir conexão',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => postgresqlApi.setDefaultConnection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postgresql-connections'] });
      toast({
        title: 'Sucesso',
        description: 'Conexão definida como padrão!',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao definir conexão padrão',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSetDefault = (e: React.MouseEvent, connection: PostgresConnection) => {
    e.stopPropagation();
    if (!connection.isDefault) {
      setDefaultMutation.mutate(connection.id);
    }
  };

  const handleDelete = (e: React.MouseEvent, connection: PostgresConnection) => {
    e.stopPropagation();
    if (window.confirm(`Deseja realmente excluir a conexão "${connection.name}"?`)) {
      deleteMutation.mutate(connection.id);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const connection: CreateConnectionRequest = {
      name: formData.get('name') as string,
      host: formData.get('host') as string,
      port: parseInt(formData.get('port') as string, 10),
      database: formData.get('database') as string,
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      sslEnabled: formData.get('sslEnabled') === 'on',
    };
    createMutation.mutate(connection);
  };

  if (isLoading) {
    return <div className="text-center p-4">Carregando conexões...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Conexões PostgreSQL</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Nova Conexão'}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Nova Conexão</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Host</label>
                <input
                  type="text"
                  name="host"
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Porta</label>
                <input
                  type="number"
                  name="port"
                  defaultValue={5432}
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Database</label>
                <input
                  type="text"
                  name="database"
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Usuário</label>
                <input
                  type="text"
                  name="username"
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Senha</label>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="sslEnabled" id="sslEnabled" />
              <label htmlFor="sslEnabled" className="text-sm">
                Habilitar SSL
              </label>
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Salvando...' : 'Salvar Conexão'}
            </Button>
          </form>
        </Card>
      )}

      <div className="grid gap-4">
        {connections.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            Nenhuma conexão configurada. Clique em "Nova Conexão" para começar.
          </Card>
        ) : (
          connections.map((connection) => (
            <Card
              key={connection.id}
              className="p-4 hover:bg-accent transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 cursor-pointer" onClick={() => setSelectedConnection(connection)}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{connection.name}</h3>
                    {connection.isDefault && (
                      <Badge variant="default" className="bg-yellow-500 text-yellow-900">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Padrão
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {connection.host}:{connection.port} / {connection.database}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Usuário: {connection.username} | SSL: {connection.sslEnabled ? 'Sim' : 'Não'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground">
                    {new Date(connection.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                  {!connection.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleSetDefault(e, connection)}
                      disabled={setDefaultMutation.isPending}
                      className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                      title="Definir como padrão"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDelete(e, connection)}
                    disabled={deleteMutation.isPending}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Excluir conexão"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
