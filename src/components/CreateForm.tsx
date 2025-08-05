
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ref as dbRef, set, push } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Download } from "lucide-react";
import { FileUploader } from "./FileUploader";
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Image from "next/image";
import templates from '@/lib/templates.json';
import type { StorageProvider } from "@/app/page";

const formSchema = z.object({
  name: z.string().optional(),
  template: z.string().optional(),
  enabled: z.boolean().default(false),
  mute: z.boolean().default(false),
});

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

const getFileExtension = (filename: string) => {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

export function CreateForm({ storageProvider }: { storageProvider: StorageProvider }) {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [newId, setNewId] = useState("");
  const [qrCodes, setQrCodes] = useState<string[]>([]);
  const [formName, setFormName] = useState("");
  const { toast } = useToast();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://saywith.com/';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      template: "",
      enabled: false,
      mute: false,
    },
  });

  const generateQRCodes = async (id: string) => {
      const fullUrl = `${baseUrl}${id}`;
      const qrCodePromises = [];
      const styles = [
          { dotsOptions: { color: "#FFA500", type: "rounded" }, backgroundOptions: { color: "#121212" } },
          { dotsOptions: { color: "#ADFF2F", type: "dots" }, backgroundOptions: { color: "#FFFFFF" } },
          { dotsOptions: { color: "#121212", type: "classy-rounded" }, backgroundOptions: { color: "#FFA500" } },
          { dotsOptions: { color: "#FFFFFF", type: "square" }, backgroundOptions: { color: "#ADFF2F" } }
      ];

      for (const style of styles) {
        const qrCodeDataURL = await QRCode.toDataURL(fullUrl, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          width: 300,
          color: {
            dark: style.dotsOptions.color,
            light: style.backgroundOptions.color,
          },
        });
        qrCodePromises.push(qrCodeDataURL);
      }
      return await Promise.all(qrCodePromises);
  };
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      const saywithRef = dbRef(db, 'Saywith');
      const newSaywithRef = push(saywithRef);
      const uniqueId = newSaywithRef.key!;
      setNewId(uniqueId);
      setFormName(values.name || "");

      let mediaUrl = "";
      let audioUrl = "";

      if (storageProvider === "firebase") {
        if (mediaFile) {
          const mediaExtension = getFileExtension(mediaFile.name);
          const fileRef = storageRef(storage, `messages/${uniqueId}/media.${mediaExtension}`);
          await uploadBytes(fileRef, mediaFile);
          mediaUrl = await getDownloadURL(fileRef);
        }
        if (audioFile) {
          const audioExtension = getFileExtension(audioFile.name);
          const fileRef = storageRef(storage, `messages/${uniqueId}/audio.${audioExtension}`);
          await uploadBytes(fileRef, audioFile);
          audioUrl = await getDownloadURL(fileRef);
        }
      } else { // custom backend
        const formData = new FormData();
        formData.append('folder', uniqueId);

        if (mediaFile) {
          const mediaExtension = getFileExtension(mediaFile.name);
          const newMediaFile = new File([mediaFile], `media.${mediaExtension}`, { type: mediaFile.type });
          formData.append('file1', newMediaFile);
        }
        if (audioFile) {
          const audioExtension = getFileExtension(audioFile.name);
          const newAudioFile = new File([audioFile], `audio.${audioExtension}`, { type: audioFile.type });
          formData.append('file2', newAudioFile);
        }

        if (mediaFile || audioFile) {
            const response = await fetch('https://giit-upload.onrender.com/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const responseData = await response.json();
            if (responseData.file1URL) mediaUrl = responseData.file1URL;
            if (responseData.file2URL) audioUrl = responseData.file2URL;
        }
      }

      let srtContent = "";
      if (srtFile) {
        srtContent = await readFileAsText(srtFile);
        srtContent = srtContent.replace(/Transcribed by TurboScribe\.ai\. Go Unlimited to remove this message/g, "made by SayWith");
      }

      await set(newSaywithRef, {
        ...values,
        mediaUrl,
        audioUrl,
        srtContent,
      });
      
      const generatedQRCodes = await generateQRCodes(uniqueId);
      setQrCodes(generatedQRCodes);

      setShowSuccessDialog(true);
      form.reset({ name: "", template: "", enabled: false, mute: false });
      setMediaFile(null);
      setAudioFile(null);
      setSrtFile(null);

    } catch (error) {
      console.error("Error creating entry:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    const fullUrl = `${baseUrl}${newId}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(fullUrl);
        toast({ title: "Copied!", description: "The URL has been copied to your clipboard." });
    }
  };

  const downloadQRCodes = async () => {
    const zip = new JSZip();
    for (let i = 0; i < qrCodes.length; i++) {
        const response = await fetch(qrCodes[i]);
        const blob = await response.blob();
        zip.file(`qrcode-style-${i+1}.png`, blob);
    }
    zip.generateAsync({type:"blob"}).then(function(content) {
        saveAs(content, `${formName || 'qrcodes'}-qrcodes.zip`);
    });
  };
  
  return (
    <>
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Create New Content</CardTitle>
          <CardDescription>Fill out the form below to add a new entry to the database.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter content name" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.map(template => (
                          <SelectItem key={template.value} value={template.value}>
                            {template.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                  <FileUploader id="media-file" label="Media File (Image/Video)" accept="image/*,video/*" file={mediaFile} onFileSelect={setMediaFile} />
                  <FileUploader id="audio-file" label="Audio File (MP3)" accept="audio/mpeg" file={audioFile} onFileSelect={setAudioFile} />
                  <FileUploader id="srt-file" label="SRT/Text File" accept=".srt,.txt" file={srtFile} onFileSelect={setSrtFile} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border border-border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Enable Status
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="mute"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border border-border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Mute
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>


              <Button type="submit" disabled={isLoading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Content
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Success!</AlertDialogTitle>
            <AlertDialogDescription>
              Your content has been saved successfully. Here is your unique URL:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2 bg-muted p-3 rounded-md border border-border">
            <pre className="text-sm text-foreground truncate flex-1 font-mono">{baseUrl}{newId}</pre>
            <Button variant="ghost" size="icon" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {qrCodes.map((src, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                    <Image src={src} alt={`QR Code Style ${index + 1}`} width={150} height={150} className="rounded-lg border border-border" />
                    <p className="text-xs text-muted-foreground">Style {index + 1}</p>
                </div>
            ))}
          </div>
          <AlertDialogFooter className="mt-4">
            <Button variant="outline" onClick={downloadQRCodes}>
                <Download className="mr-2 h-4 w-4" />
                Download All
            </Button>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    