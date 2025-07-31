import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateForm } from "@/components/CreateForm";
import { EditForm } from "@/components/EditForm";
import { SayWithLogo } from "@/components/SayWithLogo";
import { FilePlus2, Edit } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background text-foreground">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center justify-start p-4 md:p-8">
        <header className="w-full mb-8 text-center">
            <SayWithLogo className="h-12 w-auto mx-auto mb-2" />
            <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-primary">
                Media Manager
            </h1>
            <p className="text-muted-foreground mt-2">Create, manage, and edit your media content with ease.</p>
        </header>
        
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="create">
              <FilePlus2 className="mr-2 h-4 w-4" />
              Create New
            </TabsTrigger>
            <TabsTrigger value="edit">
              <Edit className="mr-2 h-4 w-4" />
              Edit Existing
            </TabsTrigger>
          </TabsList>
          <TabsContent value="create" className="mt-6">
            <CreateForm />
          </TabsContent>
          <TabsContent value="edit" className="mt-6">
            <EditForm />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="w-full text-center p-4 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} SayWith Manager. All rights reserved.
      </footer>
    </div>
  );
}
