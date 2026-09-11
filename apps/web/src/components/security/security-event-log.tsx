"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const events = [
  { id: 1, type: "LOGIN_SUCCESS", user: "admin@school.edu", ip: "192.168.1.1", time: "2 mins ago", risk: 0 },
  { id: 2, type: "MFA_ENABLED", user: "teacher@school.edu", ip: "10.0.0.5", time: "15 mins ago", risk: 5 },
  { id: 3, type: "PERMISSION_DENIED", user: "student@school.edu", ip: "172.16.0.2", time: "1 hour ago", risk: 40 },
  { id: 4, type: "PASSWORD_CHANGED", user: "staff@school.edu", ip: "192.168.1.50", time: "3 hours ago", risk: 10 },
];

export function SecurityEventLog() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Security Events</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.type}</TableCell>
                <TableCell>{event.user}</TableCell>
                <TableCell>{event.ip}</TableCell>
                <TableCell>
                   <span className={event.risk > 30 ? "text-destructive font-bold" : ""}>
                    {event.risk}
                   </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{event.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
