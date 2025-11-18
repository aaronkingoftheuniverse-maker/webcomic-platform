import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

export default function UIDemo() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">UI Demo</h1>

      <section className="space-x-4">
        <Button>Default</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Delete</Button>
      </section>

      <section className="space-x-2">
        <Badge>Active</Badge>
        <Badge variant="secondary">Secondary</Badge>
      </section>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Example Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is an example card using Shadcn components.</p>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Alice</TableCell>
            <TableCell><Badge>Online</Badge></TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Bob</TableCell>
            <TableCell><Badge variant="secondary">Offline</Badge></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
