import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loading from "@/app/components/Loading";

interface Props {
  title: string;
  value: number;
  loading?: boolean;
}

function StatsCard({ title, value, loading }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <Loading />
        ) : (
          <div className="text-3xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default StatsCard;
