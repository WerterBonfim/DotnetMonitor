import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Play, Pause, RotateCcw, ArrowRight, Info, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface ObjectState {
  id: number;
  generation: 0 | 1 | 2 | 'LOH';
  age: number;
  color: string;
  label: string;
}

type GCStep = 
  | 'initial'
  | 'allocation'
  | 'gen0-collection'
  | 'promotion-0-1'
  | 'gen1-collection'
  | 'promotion-1-2'
  | 'gen2-collection'
  | 'full-gc';

export function GCFlowVisualization() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<GCStep>('initial');
  const [objects, setObjects] = useState<ObjectState[]>([]);
  const [stepHistory, setStepHistory] = useState<GCStep[]>(['initial']);

  const steps: Record<GCStep, { title: string; description: string; duration: number }> = {
    initial: {
      title: 'Estado Inicial',
      description: 'Heap vazio, pronto para alocações',
      duration: 2000,
    },
    allocation: {
      title: 'Alocação de Objetos',
      description: 'Novos objetos são alocados na Gen 0',
      duration: 3000,
    },
    'gen0-collection': {
      title: 'Coleta Gen 0',
      description: 'GC coleta objetos mortos da Gen 0. Objetos vivos são promovidos para Gen 1',
      duration: 4000,
    },
    'promotion-0-1': {
      title: 'Promoção Gen 0 → Gen 1',
      description: 'Objetos que sobreviveram à coleta Gen 0 são promovidos para Gen 1',
      duration: 2000,
    },
    'gen1-collection': {
      title: 'Coleta Gen 1',
      description: 'GC coleta objetos mortos da Gen 1. Objetos vivos são promovidos para Gen 2',
      duration: 4000,
    },
    'promotion-1-2': {
      title: 'Promoção Gen 1 → Gen 2',
      description: 'Objetos que sobreviveram à coleta Gen 1 são promovidos para Gen 2',
      duration: 2000,
    },
    'gen2-collection': {
      title: 'Coleta Gen 2',
      description: 'GC coleta objetos mortos da Gen 2. Esta é uma coleta mais custosa',
      duration: 5000,
    },
    'full-gc': {
      title: 'Full GC',
      description: 'Coleta completa de todas as gerações, incluindo LOH. Pode causar pausas significativas',
      duration: 6000,
    },
  };

  const stepOrder: GCStep[] = [
    'initial',
    'allocation',
    'gen0-collection',
    'promotion-0-1',
    'gen1-collection',
    'promotion-1-2',
    'gen2-collection',
    'full-gc',
  ];

  useEffect(() => {
    if (!isPlaying) return;

    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      const duration = steps[currentStep].duration;
      
      const timer = setTimeout(() => {
        setCurrentStep(nextStep);
        setStepHistory((prev) => [...prev, nextStep]);
        updateObjectsForStep(nextStep);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsPlaying(false);
    }
  }, [isPlaying, currentStep]);

  const updateObjectsForStep = (step: GCStep) => {
    switch (step) {
      case 'initial':
        setObjects([]);
        break;
      case 'allocation':
        setObjects([
          { id: 1, generation: 0, age: 0, color: 'bg-blue-500', label: 'Obj1' },
          { id: 2, generation: 0, age: 0, color: 'bg-blue-500', label: 'Obj2' },
          { id: 3, generation: 0, age: 0, color: 'bg-blue-500', label: 'Obj3' },
          { id: 4, generation: 0, age: 0, color: 'bg-blue-500', label: 'Obj4' },
        ]);
        break;
      case 'gen0-collection':
        // Manter apenas objetos que sobreviveram (Obj1 e Obj3)
        setObjects((prev) =>
          prev.filter((obj) => obj.id === 1 || obj.id === 3).map((obj) => ({
            ...obj,
            age: obj.age + 1,
          }))
        );
        break;
      case 'promotion-0-1':
        setObjects((prev) =>
          prev.map((obj) =>
            obj.generation === 0 ? { ...obj, generation: 1, color: 'bg-green-500' } : obj
          )
        );
        break;
      case 'gen1-collection':
        // Manter apenas Obj1 que sobreviveu
        setObjects((prev) =>
          prev.filter((obj) => obj.id === 1).map((obj) => ({
            ...obj,
            age: obj.age + 1,
          }))
        );
        break;
      case 'promotion-1-2':
        setObjects((prev) =>
          prev.map((obj) =>
            obj.generation === 1 ? { ...obj, generation: 2, color: 'bg-yellow-500' } : obj
          )
        );
        break;
      case 'gen2-collection':
        setObjects((prev) =>
          prev.map((obj) => ({ ...obj, age: obj.age + 1 }))
        );
        break;
      case 'full-gc':
        setObjects((prev) => {
          const largeObj: ObjectState = {
            id: 5,
            generation: 'LOH',
            age: 0,
            color: 'bg-amber-500',
            label: 'LargeObj',
          };
          return [...prev, largeObj];
        });
        break;
    }
  };

  const handlePlay = () => {
    if (currentStep === 'full-gc') {
      reset();
    }
    setIsPlaying(true);
    if (currentStep === 'initial') {
      setCurrentStep('allocation');
      updateObjectsForStep('allocation');
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    reset();
  };

  const reset = () => {
    setIsPlaying(false);
    setCurrentStep('initial');
    setObjects([]);
    setStepHistory(['initial']);
  };

  const handleNext = () => {
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      setCurrentStep(nextStep);
      setStepHistory((prev) => [...prev, nextStep]);
      updateObjectsForStep(nextStep);
    }
  };

  const handlePrevious = () => {
    if (stepHistory.length > 1) {
      const newHistory = [...stepHistory];
      newHistory.pop();
      const prevStep = newHistory[newHistory.length - 1];
      setCurrentStep(prevStep);
      setStepHistory(newHistory);
      updateObjectsForStep(prevStep);
    }
  };

  const getGenerationInfo = (gen: 0 | 1 | 2 | 'LOH') => {
    switch (gen) {
      case 0:
        return { name: 'Gen 0', color: 'bg-blue-500', description: 'Objetos recém-alocados' };
      case 1:
        return { name: 'Gen 1', color: 'bg-green-500', description: 'Sobreviveram Gen 0' };
      case 2:
        return { name: 'Gen 2', color: 'bg-yellow-500', description: 'Objetos de longa duração' };
      case 'LOH':
        return { name: 'LOH', color: 'bg-amber-500', description: 'Objetos >= 85KB' };
    }
  };

  const currentStepInfo = steps[currentStep];
  const canGoNext = stepOrder.indexOf(currentStep) < stepOrder.length - 1;
  const canGoPrevious = stepHistory.length > 1;

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Controles da Animação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              variant="default"
              onClick={isPlaying ? handlePause : handlePlay}
              className="flex items-center gap-2"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Pausar' : 'Reproduzir'}
            </Button>
            <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Reiniciar
            </Button>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={!canGoPrevious}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={!canGoNext || isPlaying}
                className="flex items-center gap-1"
              >
                Próximo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informação do Passo Atual */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <strong>{currentStepInfo.title}</strong>
              <p className="text-sm mt-1">{currentStepInfo.description}</p>
            </div>
            <Badge variant="outline">
              Passo {stepOrder.indexOf(currentStep) + 1} de {stepOrder.length}
            </Badge>
          </div>
        </AlertDescription>
      </Alert>

      {/* Visualização do Heap */}
      <Card>
        <CardHeader>
          <CardTitle>Visualização do Heap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Gen 0 */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <h3 className="font-semibold">Gen 0 - Objetos Jovens</h3>
                <Badge variant="outline" className="ml-2">
                  {objects.filter((o) => o.generation === 0).length} objetos
                </Badge>
              </div>
              <div className="min-h-[120px] border-2 border-blue-500/50 rounded-lg p-4 bg-blue-500/5 flex flex-wrap gap-2 items-start relative">
                {objects
                  .filter((o) => o.generation === 0)
                  .map((obj) => (
                    <div
                      key={obj.id}
                      className={`${obj.color} text-white px-3 py-2 rounded-md text-sm font-medium shadow-md transition-all duration-500 ease-in-out hover:scale-105`}
                      style={{
                        animation: 'slideIn 0.5s ease-out',
                      }}
                    >
                      {obj.label}
                    </div>
                  ))}
                {objects.filter((o) => o.generation === 0).length === 0 && (
                  <div className="text-muted-foreground text-sm absolute inset-0 flex items-center justify-center">
                    Vazio
                  </div>
                )}
              </div>
            </div>

            {/* Seta de Promoção 0→1 */}
            {objects.some((o) => o.generation === 1) && (
              <div className="flex justify-center">
                <div className="flex flex-col items-center">
                  <ArrowRight className="h-6 w-6 text-green-500 rotate-90" />
                  <span className="text-xs text-muted-foreground mt-1">Promoção após sobreviver Gen 0</span>
                </div>
              </div>
            )}

            {/* Gen 1 */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <h3 className="font-semibold">Gen 1 - Objetos Intermediários</h3>
                <Badge variant="outline" className="ml-2">
                  {objects.filter((o) => o.generation === 1).length} objetos
                </Badge>
              </div>
              <div className="min-h-[120px] border-2 border-green-500/50 rounded-lg p-4 bg-green-500/5 flex flex-wrap gap-2 items-start relative">
                {objects
                  .filter((o) => o.generation === 1)
                  .map((obj) => (
                    <div
                      key={obj.id}
                      className={`${obj.color} text-white px-3 py-2 rounded-md text-sm font-medium shadow-md transition-all duration-500 ease-in-out hover:scale-105`}
                      style={{
                        animation: 'slideIn 0.5s ease-out',
                      }}
                    >
                      {obj.label}
                    </div>
                  ))}
                {objects.filter((o) => o.generation === 1).length === 0 && (
                  <div className="text-muted-foreground text-sm absolute inset-0 flex items-center justify-center">
                    Vazio
                  </div>
                )}
              </div>
            </div>

            {/* Seta de Promoção 1→2 */}
            {objects.some((o) => o.generation === 2) && (
              <div className="flex justify-center">
                <div className="flex flex-col items-center">
                  <ArrowRight className="h-6 w-6 text-yellow-500 rotate-90" />
                  <span className="text-xs text-muted-foreground mt-1">Promoção após sobreviver Gen 1</span>
                </div>
              </div>
            )}

            {/* Gen 2 */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <h3 className="font-semibold">Gen 2 - Objetos de Longa Duração</h3>
                <Badge variant="outline" className="ml-2">
                  {objects.filter((o) => o.generation === 2).length} objetos
                </Badge>
              </div>
              <div className="min-h-[120px] border-2 border-yellow-500/50 rounded-lg p-4 bg-yellow-500/5 flex flex-wrap gap-2 items-start relative">
                {objects
                  .filter((o) => o.generation === 2)
                  .map((obj) => (
                    <div
                      key={obj.id}
                      className={`${obj.color} text-white px-3 py-2 rounded-md text-sm font-medium shadow-md transition-all duration-500 ease-in-out hover:scale-105`}
                      style={{
                        animation: 'slideIn 0.5s ease-out',
                      }}
                    >
                      {obj.label}
                    </div>
                  ))}
                {objects.filter((o) => o.generation === 2).length === 0 && (
                  <div className="text-muted-foreground text-sm absolute inset-0 flex items-center justify-center">
                    Vazio
                  </div>
                )}
              </div>
            </div>

            {/* LOH */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-amber-500 rounded"></div>
                <h3 className="font-semibold">Large Object Heap (LOH)</h3>
                <Badge variant="outline" className="ml-2">
                  {objects.filter((o) => o.generation === 'LOH').length} objetos
                </Badge>
              </div>
              <div className="min-h-[120px] border-2 border-amber-500/50 rounded-lg p-4 bg-amber-500/5 flex flex-wrap gap-2 items-start relative">
                {objects
                  .filter((o) => o.generation === 'LOH')
                  .map((obj) => (
                    <div
                      key={obj.id}
                      className={`${obj.color} text-white px-3 py-2 rounded-md text-sm font-medium shadow-md transition-all duration-500 ease-in-out hover:scale-105`}
                      style={{
                        animation: 'slideIn 0.5s ease-out',
                      }}
                    >
                      {obj.label}
                    </div>
                  ))}
                {objects.filter((o) => o.generation === 'LOH').length === 0 && (
                  <div className="text-muted-foreground text-sm absolute inset-0 flex items-center justify-center">
                    Vazio (objetos &gt;= 85KB vão aqui)
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagrama de Fluxo */}
      <Card>
        <CardHeader>
          <CardTitle>Diagrama de Fluxo do GC</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center gap-4 w-full justify-center">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 border-2 border-blue-500 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <span className="text-xs font-semibold">Gen 0</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">Alocação</span>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 border-2 border-green-500 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <span className="text-xs font-semibold">Gen 1</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">Sobreviveu Gen 0</span>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 border-2 border-yellow-500 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <span className="text-xs font-semibold">Gen 2</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">Sobreviveu Gen 1</span>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full justify-center mt-4">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 border-2 border-amber-500 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <span className="text-xs font-semibold">LOH</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">Objetos &gt;= 85KB</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  (alocação direta, não passa por gerações)
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Fluxo:</strong> Objetos começam na Gen 0. Se sobreviverem a uma coleta, são promovidos para Gen 1.
                Se sobreviverem Gen 1, são promovidos para Gen 2. Objetos grandes (&gt;= 85KB) vão direto para LOH.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Explicação Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Explicação do Passo Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentStep === 'initial' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  O heap está vazio. Quando a aplicação começa a alocar objetos, eles vão para a Gen 0.
                </p>
              </div>
            )}

            {currentStep === 'allocation' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Alocação:</strong> Novos objetos são sempre alocados na Gen 0, independentemente de seu tamanho
                  (exceto objetos &gt;= 85KB que vão direto para LOH).
                </p>
                <p className="text-sm text-muted-foreground">
                  Objetos na Gen 0 são considerados "jovens" e têm maior probabilidade de serem coletados rapidamente.
                </p>
              </div>
            )}

            {currentStep === 'gen0-collection' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Coleta Gen 0:</strong> Quando a Gen 0 fica cheia ou há pressão de memória, o GC executa uma
                  coleta Gen 0. Esta é uma coleta muito rápida (tipicamente &lt; 1ms).
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Trash2 className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-muted-foreground">
                    <strong>Objetos coletados:</strong> Obj2 e Obj4 foram coletados (não tinham mais referências)
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Objetos que não têm mais referências são marcados como "mortos" e coletados. Objetos que ainda têm
                  referências são marcados como "vivos" e serão promovidos.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Exemplo:</strong> Se você criar uma string temporária em um método e o método terminar, a
                  string pode ser coletada na próxima Gen 0.
                </p>
              </div>
            )}

            {currentStep === 'promotion-0-1' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Promoção Gen 0 → Gen 1:</strong> Objetos que sobreviveram à coleta Gen 0 são promovidos para
                  Gen 1.
                </p>
                <p className="text-sm text-muted-foreground">
                  Isso indica que esses objetos têm uma vida útil mais longa do que o esperado. Eles podem ser objetos
                  em cache, variáveis de instância de classes, ou objetos referenciados por objetos de longa duração.
                </p>
              </div>
            )}

            {currentStep === 'gen1-collection' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Coleta Gen 1:</strong> Coletas Gen 1 são menos frequentes que Gen 0, mas ainda relativamente
                  rápidas.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Trash2 className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-muted-foreground">
                    <strong>Objetos coletados:</strong> Obj3 foi coletado (não tinha mais referências)
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Objetos mortos na Gen 1 são coletados. Objetos vivos são promovidos para Gen 2.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Exemplo:</strong> Um objeto que foi criado durante o processamento de uma requisição HTTP e
                  ainda está sendo usado pode sobreviver Gen 0 e Gen 1.
                </p>
              </div>
            )}

            {currentStep === 'promotion-1-2' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Promoção Gen 1 → Gen 2:</strong> Objetos que sobreviveram Gen 1 são promovidos para Gen 2.
                </p>
                <p className="text-sm text-muted-foreground">
                  Objetos na Gen 2 são considerados de "longa duração" e podem incluir singletons, cache de aplicação,
                  ou objetos que são mantidos durante toda a vida útil da aplicação.
                </p>
              </div>
            )}

            {currentStep === 'gen2-collection' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Coleta Gen 2:</strong> Coletas Gen 2 são raras mas custosas. Podem causar pausas de 50-500ms
                  ou mais.
                </p>
                <p className="text-sm text-muted-foreground">
                  Uma coleta Gen 2 pode ser "ephemeral" (apenas Gen 2) ou "full" (todas as gerações + LOH).
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Exemplo:</strong> Se o heap Gen 2 crescer muito ou houver pressão de memória, o GC pode executar
                  uma coleta Gen 2 para liberar espaço.
                </p>
              </div>
            )}

            {currentStep === 'full-gc' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Full GC:</strong> Uma coleta completa de todas as gerações, incluindo LOH. Esta é a coleta
                  mais custosa e pode causar pausas significativas.
                </p>
                <p className="text-sm text-muted-foreground">
                  Durante um Full GC, o LOH pode ser compactado (isso só acontece em Full GC).
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Exemplo:</strong> Quando a memória disponível está muito baixa ou há muitos objetos grandes
                  no LOH, o GC pode executar um Full GC.
                </p>
                <Alert variant="default" className="mt-4">
                  <AlertDescription>
                    <strong>Importante:</strong> Full GCs frequentes indicam problemas de memória. Objetos devem morrer
                    em Gen 0 ou Gen 1, não chegar a Gen 2.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exemplos Práticos */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplos Práticos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Exemplo 1: Objeto de Vida Curta</h4>
              <p className="text-sm text-muted-foreground">
                Uma variável local em um método é alocada na <strong>Gen 0</strong>. Quando o método termina, a
                variável sai de escopo. Na próxima coleta <strong>Gen 0</strong>, o objeto é coletado.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Exemplo 2: Objeto de Vida Média</h4>
              <p className="text-sm text-muted-foreground">
                Um objeto criado durante o processamento de uma requisição HTTP sobrevive a uma coleta{' '}
                <strong>Gen 0</strong> e é promovido para <strong>Gen 1</strong>. Quando a requisição termina, o objeto
                pode ser coletado na próxima <strong>Gen 1</strong>.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Exemplo 3: Objeto de Longa Duração</h4>
              <p className="text-sm text-muted-foreground">
                Um singleton ou objeto de cache sobrevive a múltiplas coletas e é promovido para <strong>Gen 2</strong>.
                Esses objetos só são coletados em <strong>Gen 2</strong> ou <strong>Full GC</strong> quando não há mais
                referências.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Exemplo 4: Objeto Grande</h4>
              <p className="text-sm text-muted-foreground">
                Um array ou string de 100KB é alocado diretamente no <strong>LOH</strong> (não passa por Gen 0). O LOH
                não é compactado em coletas Gen 0/1, apenas em <strong>Full GC</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
