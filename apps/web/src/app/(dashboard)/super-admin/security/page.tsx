import { Metadata } from "next";
import { SecurityOverview } from "@/components/security/security-overview";
import { SecurityIncidentList } from "@/components/security/security-incident-list";
import { SecurityEventLog } from "@/components/security/security-event-log";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Security Operations | Super Admin",
  description: "Platform security monitoring and incident management",
};

export default function SecurityPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Security Operations</h2>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="policies">Platform Policies</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <SecurityOverview />
        </TabsContent>
        <TabsContent value="incidents" className="space-y-4">
          <SecurityIncidentList />
        </TabsContent>
        <TabsContent value="events" className="space-y-4">
          <SecurityEventLog />
        </TabsContent>
        <TabsContent value="policies" className="space-y-4">
          {/* Policy Management Component */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
