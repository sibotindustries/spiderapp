import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCrimeSchema, crimeTypes, priorityLevels } from "@shared/schema";
import { useCrimes } from "@/hooks/use-crimes";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateRandomLocation } from "@/lib/utils";

interface ReportCrimeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReportCrimeModal({ isOpen, onClose }: ReportCrimeModalProps) {
  const { createCrime } = useCrimes();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const isMobile = useIsMobile();

  const form = useForm({
    resolver: zodResolver(insertCrimeSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      crimeType: "Robbery",
      priorityLevel: "Medium",
      latitude: "40.7128",
      longitude: "-74.0060",
      photos: []
    }
  });

  const onSubmit = async (data: any) => {
    // Simulate photo upload and get URLs
    setUploading(true);
    
    // For demo purposes, we'll use placeholder image URLs
    const photoUrls = selectedFiles.map((_, index) => 
      `https://picsum.photos/400/300?random=${index + 1}`
    );
    
    setTimeout(() => {
      createCrime.mutate({
        ...data,
        photos: photoUrls
      }, {
        onSuccess: () => {
          form.reset();
          setSelectedFiles([]);
          onClose();
        }
      });
      setUploading(false);
    }, 1000);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const useCurrentLocation = () => {
    // For demo purposes, generate a random location within NYC area
    const { lat, lng } = generateRandomLocation();
    
    form.setValue("latitude", lat.toString());
    form.setValue("longitude", lng.toString());
    form.setValue("location", "Current Location, New York, NY");
  };

  if (isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <DialogContent className="bg-card border border-primary/30 rounded-lg w-full max-w-[95%] max-h-[80vh] relative m-auto overflow-hidden">
            <div className="web-decoration top-0 left-0"></div>
            <div className="web-decoration bottom-0 right-0"></div>
            
            <DialogHeader className="pb-2">
              <DialogTitle className="font-rajdhani font-bold text-xl text-primary">
                Report a Crime
              </DialogTitle>
              <DialogDescription className="text-xs">
                Submit details about criminal activity you've witnessed.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form 
                onSubmit={form.handleSubmit(onSubmit)} 
                className="space-y-3 overflow-y-auto max-h-[50vh] pr-1 touch-auto -webkit-overflow-scrolling-touch"
              >
                <FormField
                  control={form.control}
                  name="crimeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/70">Crime Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-card/50 border-foreground/20 focus:border-primary">
                            <SelectValue placeholder="Select crime type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {crimeTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/70">Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brief title of the incident"
                          className="bg-card/50 border-foreground/20 focus:border-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-foreground/70">Location</FormLabel>
                        <div className="flex">
                          <FormControl>
                            <Input
                              placeholder="Enter address or use current location"
                              className="bg-card/50 border-foreground/20 focus:border-primary rounded-r-none"
                              {...field}
                            />
                          </FormControl>
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="rounded-l-none border-l-0"
                            onClick={useCurrentLocation}
                          >
                            <i className="fas fa-location-arrow"></i>
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Hidden fields for coordinates */}
                <input type="hidden" {...form.register("latitude")} />
                <input type="hidden" {...form.register("longitude")} />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/70">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what you witnessed..."
                          className="bg-card/50 border-foreground/20 focus:border-primary"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="mb-2">
                  <label className="block text-foreground/70 mb-1 text-xs">Upload Evidence</label>
                  <div 
                    className="border-dashed border-2 border-foreground/20 rounded-md p-3 text-center"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      accept="image/*"
                    />
                    
                    {selectedFiles.length > 0 ? (
                      <div>
                        <p className="text-foreground mb-1 text-xs">{selectedFiles.length} file(s) selected</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="bg-foreground/10 rounded p-1.5 text-2xs">
                              {file.name.length > 10 
                                ? `${file.name.slice(0, 8)}...` 
                                : file.name}
                            </div>
                          ))}
                        </div>
                        <button 
                          type="button" 
                          className="text-xs text-secondary hover:text-secondary/80 mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFiles([]);
                          }}
                        >
                          Clear selection
                        </button>
                      </div>
                    ) : (
                      <>
                        <i className="fas fa-camera text-foreground/50 text-xl mb-1"></i>
                        <p className="text-foreground/50 text-xs mb-1">
                          Tap to upload photos
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="priorityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/70">Priority Level</FormLabel>
                      <div className="flex space-x-2">
                        {priorityLevels.map((level) => (
                          <label 
                            key={level}
                            className={`flex items-center p-2 border ${
                              field.value === level 
                                ? level === "High" 
                                  ? "border-[#ffcc00]/30 bg-[#ffcc00]/10" 
                                  : "border-primary/30 bg-primary/10"
                                : "border-foreground/20"
                            } rounded-md cursor-pointer flex-1 hover:bg-foreground/5`}
                          >
                            <input
                              type="radio"
                              name="priorityLevel"
                              className="mr-2"
                              value={level}
                              checked={field.value === level}
                              onChange={() => field.onChange(level)}
                            />
                            <span>{level}</span>
                          </label>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-center mt-3 pt-1">
                  <Button 
                    type="submit"
                    disabled={createCrime.isPending || uploading}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 text-sm rounded-md mr-3 font-rajdhani font-medium"
                  >
                    {(createCrime.isPending || uploading) ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i> Sending...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-2"></i> Send
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="bg-card border border-foreground/20 hover:bg-foreground/10 text-foreground/70 px-4 py-1.5 text-sm rounded-md font-rajdhani font-medium"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </div>
      </Dialog>
    );
  }

  // Desktop version
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border border-primary/30 rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden relative left-1/2 -translate-x-1/2">
        <div className="web-decoration top-0 left-0"></div>
        <div className="web-decoration bottom-0 right-0"></div>
        
        <DialogHeader>
          <DialogTitle className="font-rajdhani font-bold text-2xl text-primary">
            Report a Crime
          </DialogTitle>
          <DialogDescription>
            Submit details about criminal activity you've witnessed.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-4 overflow-y-auto max-h-[60vh] pr-1 touch-auto"
          >
            <FormField
              control={form.control}
              name="crimeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/70">Crime Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-card/50 border-foreground/20 focus:border-primary">
                        <SelectValue placeholder="Select crime type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {crimeTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/70">Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief title of the incident"
                      className="bg-card/50 border-foreground/20 focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-foreground/70">Location</FormLabel>
                    <div className="flex">
                      <FormControl>
                        <Input
                          placeholder="Enter address or use current location"
                          className="bg-card/50 border-foreground/20 focus:border-primary rounded-r-none"
                          {...field}
                        />
                      </FormControl>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="rounded-l-none border-l-0"
                        onClick={useCurrentLocation}
                      >
                        <i className="fas fa-location-arrow"></i>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Hidden fields for coordinates */}
            <input type="hidden" {...form.register("latitude")} />
            <input type="hidden" {...form.register("longitude")} />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/70">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what you witnessed..."
                      className="bg-card/50 border-foreground/20 focus:border-primary"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mb-4">
              <label className="block text-foreground/70 mb-2 text-sm">Upload Evidence</label>
              <div 
                className="border-dashed border-2 border-foreground/20 rounded-md p-6 text-center"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  accept="image/*"
                />
                
                {selectedFiles.length > 0 ? (
                  <div>
                    <p className="text-foreground mb-2">{selectedFiles.length} file(s) selected</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="bg-foreground/10 rounded p-2 text-xs">
                          {file.name.length > 15 
                            ? `${file.name.slice(0, 12)}...` 
                            : file.name}
                        </div>
                      ))}
                    </div>
                    <button 
                      type="button" 
                      className="text-sm text-secondary hover:text-secondary/80 mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFiles([]);
                      }}
                    >
                      Clear selection
                    </button>
                  </div>
                ) : (
                  <>
                    <i className="fas fa-camera text-foreground/50 text-2xl mb-2"></i>
                    <p className="text-foreground/50 text-sm mb-2">
                      Drag photos here or click to upload
                    </p>
                    <button 
                      type="button" 
                      className="text-sm text-secondary hover:text-secondary/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      Select Files
                    </button>
                  </>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="priorityLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/70">Priority Level</FormLabel>
                  <div className="flex space-x-2">
                    {priorityLevels.map((level) => (
                      <label 
                        key={level}
                        className={`flex items-center p-2 border ${
                          field.value === level 
                            ? level === "High" 
                              ? "border-[#ffcc00]/30 bg-[#ffcc00]/10" 
                              : "border-primary/30 bg-primary/10"
                            : "border-foreground/20"
                        } rounded-md cursor-pointer flex-1 hover:bg-foreground/5`}
                      >
                        <input
                          type="radio"
                          name="priorityLevel"
                          className="mr-2"
                          value={level}
                          checked={field.value === level}
                          onChange={() => field.onChange(level)}
                        />
                        <span>{level}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-center mt-6 pt-2">
              <Button 
                type="submit"
                disabled={createCrime.isPending || uploading}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-md mr-3 font-rajdhani font-medium"
              >
                {(createCrime.isPending || uploading) ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i> Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i> Submit Report
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="bg-card border border-foreground/20 hover:bg-foreground/10 text-foreground/70 px-6 py-2 rounded-md font-rajdhani font-medium"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}