"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const incidents = [
  { id: "INC-001", title: "Suspicious Login Spike", severity: "HIGH", status: "INVESTIGATING", detectedAt: "2024-03-20 14:30" },
  { id: "INC-002", title: "Cross-Tenant Access Attempt", severity: "CRITICAL", status: "OPEN", detectedAt: "2024-03-20 15:45" },
  { id: "INC-003", title: "Unusual Export Activity", severity: "MEDIUM", status: "RESOLVED", detectedAt: "2024-03-19 09:15" },
];

export function SecurityIncidentList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Incidents</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Detected At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map((incident) => (
              <TableRow key={incident.id}>
                <TableCell className="font-medium">{incident.id}</TableCell>
                <TableCell>{incident.title}</TableCell>
                <TableCell>
                  <Badge variant={incident.severity === 'CRITICAL' || incident.severity === 'HIGH' ? 'destructive' : 'secondary'}>
                    {incident.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{incident.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{incident.detectedAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
