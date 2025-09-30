import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowRight,
  FilePlus,
  Send,
  UserCheck,
  FileCheck,
  FileDown,
  User,
} from 'lucide-react';

const workflowSteps = [
  {
    icon: FilePlus,
    title: '1. Client Creates Request',
    description: 'Client submits a new request from their portal, providing end-user details and selecting the required report type.',
  },
  {
    icon: Send,
    title: '2. Form Dispatched to End-User',
    description: 'The system automatically generates a unique link and sends it to the end-user to complete a dynamic form.',
  },
  {
    icon: UserCheck,
    title: '3. Analyst Assigned',
    description: 'Once the form is submitted, the ticket appears for the manager to assign it to an available analyst.',
  },
  {
    icon: FileCheck,
    title: '4. Analyst Completes Report',
    description: 'The analyst reviews the submitted information, adds notes, completes the report, and uploads it to the ticket.',
  },
  {
    icon: User,
    title: '5. Manager Review',
    description: 'The completed report is sent to a manager for final review, approval, and closing of the ticket.',
  },
  {
    icon: FileDown,
    title: '6. Report Delivered to Client',
    description: 'The final report is made available in the client\'s portal for download and feedback.',
  },
];

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4">
      <h1 className="text-3xl font-bold font-headline">Business Workflow</h1>

      <Card>
        <CardHeader>
          <CardTitle>Investigation Process Overview</CardTitle>
          <CardDescription>
            This is the end-to-end process for every background check request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 md:grid-cols-1">
            {workflowSteps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="flex w-full items-center">
                  <div className="flex flex-1 flex-col items-center justify-center rounded-lg border bg-card p-6 shadow-sm">
                    <div className="mb-4 rounded-full bg-primary p-3 text-primary-foreground">
                      <step.icon className="size-6" />
                    </div>
                    <h3 className="mb-2 font-headline text-lg font-semibold">
                      {step.title}
                    </h3>
                    <p className="px-4 text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  {index < workflowSteps.length - 1 && (
                     <ArrowRight className="mx-4 hidden h-8 w-8 shrink-0 text-muted-foreground md:block" />
                  )}
                </div>
                 {index < workflowSteps.length - 1 && (
                    <div className="my-4 h-8 w-px bg-border md:hidden" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
