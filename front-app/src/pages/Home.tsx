import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Dotnet Monitor</h1>
          <p className="text-muted-foreground text-lg">
            Escolha uma ferramenta para começar
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/gc')}>
            <div className="space-y-4">
              <div className="text-6xl mb-4">🗑️</div>
              <h2 className="text-2xl font-bold">Garbage Collector</h2>
              <p className="text-muted-foreground">
                Monitore e analise o desempenho do Garbage Collector do .NET.
                Visualize estatísticas de gerações, heap e métricas de memória.
              </p>
              <Button className="w-full mt-4">Acessar GC Dashboard</Button>
            </div>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/postgresql')}>
            <div className="space-y-4">
              <div className="text-6xl mb-4">🐘</div>
              <h2 className="text-2xl font-bold">PostgreSQL Tools</h2>
              <p className="text-muted-foreground">
                Gerencie conexões PostgreSQL, analise query plans e monitore
                métricas de performance do banco de dados.
              </p>
              <Button className="w-full mt-4">Acessar PostgreSQL Tools</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
