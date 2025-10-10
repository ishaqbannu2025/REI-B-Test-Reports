'use client';

import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

type CategoryChartProps = {
  data: { category: string, count: number, fill: string }[];
};

const chartConfig = {
  count: {
    label: 'Count',
  },
  domestic: {
    label: 'Domestic',
    color: 'hsl(var(--chart-1))',
  },
  commercial: {
    label: 'Commercial',
    color: 'hsl(var(--chart-2))',
  },
  industrial: {
    label: 'Industrial',
    color: 'hsl(var(--chart-3))',
  },
} satisfies import('@/components/ui/chart').ChartConfig;


export function CategoryChart({ data }: CategoryChartProps) {
  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle>Reports by Category</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis allowDecimals={false} />
            <Tooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total reports for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
