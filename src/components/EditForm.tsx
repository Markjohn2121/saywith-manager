
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ref as dbRef, get, update } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { FileUploader } from "./FileUploader";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  template: z.string().min(1, { message: "Please select a template." }),
  enabled: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface DbData extends FormData {
    mediaUrl: string;
    audioUrl: string;
    srtContent: string;
}

const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
};

export function EditForm() {
  const [id, setId] = useState("");
  const [loadedData, setLoadedData] = useState<DbData | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [srtContent, setSrtContent] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", template: "", enabled: false },
  });

  useEffect(() => {
    if (loadedData) {
      form.reset({
        name: loadedData.name,
        template: loadedData.template,
        enabled: loadedData.enabled,
      });
      setSrtContent(loadedData.srtContent);
    } else {
        form.reset({ name: "", template: "", enabled: false });
        setSrtContent("");
    }
  }, [loadedData, form]);

  const handleFetchData = async () => {
    if (!id) {
      toast({ variant: "destructive", title: "Please enter an ID." });
      return;
    }
    setIsFetching(true);
    setLoadedData(null);
    try {
      const snapshot = await get(dbRef(db, `Saywith/${id}`));
      if (snapshot.exists()) {
        setLoadedData(snapshot.val());
        toast({ title: "Success", description: "Data loaded successfully." });
      } else {
        toast({ variant: "destructive", title: "Not Found", description: "No data found for this ID." });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch data." });
    } finally {
      setIsFetching(false);
    }
  };

  const onUpdate = async (values: FormData) => {
    if (!id || !loadedData) return;
    setIsUpdating(true);

    try {
        let mediaUrl = loadedData.mediaUrl;
        if (mediaFile) {
            const fileRef = storageRef(storage, `media/${Date.now()}_${mediaFile.name}`);
            await uploadBytes(fileRef, mediaFile);
            mediaUrl = await getDownloadURL(fileRef);
        }

        let audioUrl = loadedData.audioUrl;
        if (audioFile) {
            const fileRef = storageRef(storage, `audio/${Date.now()}_${audioFile.name}`);
            await uploadBytes(fileRef, audioFile);
            audioUrl = await getDownloadURL(fileRef);
        }

        let finalSrtContent = srtContent;
        if (srtFile) {
            finalSrtContent = await readFileAsText(srtFile);
        }
        
        await update(dbRef(db, `Saywith/${id}`), {
            ...values,
            mediaUrl,
            audioUrl,
            srtContent: finalSrtContent,
        });

      toast({ title: "Success", description: "Content updated successfully." });
      setMediaFile(null);
      setAudioFile(null);
      setSrtFile(null);
      setLoadedData(prev => prev ? {...prev, ...values, mediaUrl, audioUrl, srtContent: finalSrtContent} : null);

    } catch (error) {
      console.error("Error updating entry:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update content." });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Edit Existing Content</CardTitle>
        <CardDescription>Enter an ID to load and edit its data.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex w-full items-center space-x-2 mb-6">
          <Input type="text" placeholder="Enter Unique ID" value={id} onChange={(e) => setId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleFetchData()} />
          <Button type="button" onClick={handleFetchData} disabled={isFetching}>
            {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Load
          </Button>
        </div>

        {isFetching && <div className="text-center p-8"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>}

        {loadedData && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-6 animate-in fade-in-50">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="template1">Template 1</SelectItem>
                          <SelectItem value="template2">Template 2</SelectItem>
                          <SelectItem value="template3">Template 3</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <FileUploader id="edit-media-file" label="Replace Media File" accept="image/*,video/*" file={mediaFile} onFileSelect={setMediaFile} />
                  {loadedData.mediaUrl && !mediaFile && <p className="text-sm text-muted-foreground">Current: <a href={loadedData.mediaUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">View Media</a></p>}
                  
                  <FileUploader id="edit-audio-file" label="Replace Audio File" accept="audio/mpeg" file={audioFile} onFileSelect={setAudioFile} />
                  {loadedData.audioUrl && !audioFile && <p className="text-sm text-muted-foreground">Current: <a href={loadedData.audioUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Listen to Audio</a></p>}

                  <FileUploader id="edit-srt-file" label="Replace SRT/Text File" accept=".srt,.txt" file={srtFile} onFileSelect={setSrtFile} />
                  <FormItem>
                      <FormLabel>SRT/Text Content</FormLabel>
                      <FormControl>
                          <Textarea placeholder="SRT/Text content will be displayed here." value={srtContent} onChange={(e) => setSrtContent(e.target.value)} rows={8} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                </div>

                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Enable Status</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isUpdating} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Update Content
                </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
