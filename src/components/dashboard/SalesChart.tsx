import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { date: "24-Nov", sales: 0 },
  { date: "25-Nov", sales: 0 },
  { date: "26-Nov", sales: 0 },
  { date: "27-Nov", sales: 0 },
  { date: "28-Nov", sales: 0 },
  { date: "29-Nov", sales: 0 },
  { date: "30-Nov", sales: 0 },
  { date: "1-Dec", sales: 0 },
  { date: "2-Dec", sales: 0 },
  { date: "3-Dec", sales: 0 },
  { date: "4-Dec", sales: 0 },
  { date: "5-Dec", sales: 0 },
  { date: "6-Dec", sales: 0 },
  { date: "7-Dec", sales: 0 },
  { date: "8-Dec", sales: 0 },
  { date: "9-Dec", sales: 0 },
  { date: "10-Dec", sales: 0 },
  { date: "11-Dec", sales: 0 },
  { date: "12-Dec", sales: 0 },
  { date: "13-Dec", sales: 0 },
  { date: "14-Dec", sales: 0 },
  { date: "15-Dec", sales: 0 },
  { date: "16-Dec", sales: 0 },
  { date: "17-Dec", sales: 0 },
  { date: "18-Dec", sales: 0 },
  { date: "19-Dec", sales: 0 },
  { date: "20-Dec", sales: 0 },
  { date: "21-Dec", sales: 0 },
  { date: "22-Dec", sales: 0 },
  { date: "23-Dec", sales: 0 },
];

const SalesChart = () => {
  return (
    <div className="bg-card rounded-xl p-4 lg:p-6 shadow-sm border border-border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 lg:mb-6 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs lg:text-sm text-muted-foreground">→ EDOXO (BL0001)</span>
        </div>
        <h3 className="text-base lg:text-lg font-semibold text-card-foreground flex items-center gap-2 order-first sm:order-last">
          <span className="w-1 h-5 bg-primary rounded-full" />
          المبيعات في آخر 30 يوماً
        </h3>
      </div>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[600px]">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                interval={2}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                width={30}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px"
                }}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SalesChart;
