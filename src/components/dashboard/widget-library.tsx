
'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { PlusCircle, Library } from 'lucide-react';
import type { Layout } from 'react-grid-layout';

interface WidgetLibraryProps {
  allWidgets: { [key: string]: { title: string; defaultLayout: Layout } };
  activeWidgets: string[];
  onAddWidget: (widgetId: string) => void;
}

export function WidgetLibrary({
  allWidgets,
  activeWidgets,
  onAddWidget,
}: WidgetLibraryProps) {
  const availableWidgets = Object.keys(allWidgets).filter(
    (id) => !activeWidgets.includes(id)
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Library className="mr-2" />
          Widget Library
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Widgets to Dashboard</SheetTitle>
          <SheetDescription>
            Click a widget from the library to add it to your dashboard.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-2">
          {availableWidgets.length > 0 ? (
            availableWidgets.map((widgetId) => (
              <div
                key={widgetId}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <p className="font-medium">
                  {allWidgets[widgetId]?.title || widgetId}
                </p>
                <SheetTrigger asChild>
                    <Button size="sm" onClick={() => onAddWidget(widgetId)}>
                        <PlusCircle className="mr-2" />
                        Add
                    </Button>
                </SheetTrigger>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              All available widgets are on your dashboard.
            </p>
          )}
        </div>
        <SheetFooter>
            <p className='text-xs text-muted-foreground'>Widgets you add will appear at the bottom of the dashboard. You can then drag them into place.</p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
