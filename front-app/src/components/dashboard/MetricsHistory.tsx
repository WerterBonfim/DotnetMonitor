import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useEffect, useState } from 'react';
import type { GCStats } from '../../types/gc';

interface MetricsHistoryProps {
  stats: GCStats | undefined;
}

interface HistoryDataPoint {
  time: string;
  'Gen 0': number;
  'Gen 1': number;
  'Gen 2': number;
  'LOH': number;
  Fragmentação: number;
}

export function MetricsHistory({ stats }: MetricsHistoryProps) {
  const [history, setHistory] = useState<HistoryDataPoint[]>([]);

  useEffect(() => {
    if (!stats) return;

    const newPoint: HistoryDataPoint = {
      time: new Date(stats.timestamp).toLocaleTimeString('pt-BR'),
      'Gen 0': stats.gen0.fragmentationPercent,
      'Gen 1': stats.gen1.fragmentationPercent,
      'Gen 2': stats.gen2.fragmentationPercent,
      'LOH': (stats.lohSizeBytes / stats.totalMemoryBytes) * 100,
      Fragmentação: stats.overallFragmentationPercent,
    };

    setHistory((prev) => {
      const updated = [...prev, newPoint];
      return updated.slice(-20);
    });
  }, [stats]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Métricas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="Gen 0"
              stroke="#8884d8"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Gen 1"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Gen 2"
              stroke="#ffc658"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="LOH"
              stroke="#ff7300"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Fragmentação"
              stroke="#00ff00"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
