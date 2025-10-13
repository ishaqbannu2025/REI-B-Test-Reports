
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useFirebase, useUser, updateDocumentNonBlocking, FirestorePermissionError, errorEmitter } from '@/firebase';
import {
  collectionGroup,
  query,
  where,
  getDocs,
  doc,
} from 'firebase/firestore';
import type { TestReport } from '@/lib/types';
import { notFound, useParams, useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

const formSchema = z.object({
  uin: z.string().min(1, 'UIN is required.'),
  applicantName: z.string().min(1, 'Applicant name is required.'),
  shortAddress: z.string().min(1, 'Address is required.'),
  district: z.string().min(1, 'District is required.'),
  category: z.enum(['Domestic', 'Commercial', 'Industrial']),
  sanctionedLoad: z.string().min(1, 'Sanctioned load is required.'),
  proposedTransformer: z.string().min(1, 'Transformer info is required.'),
  governmentFee: z.coerce.number().min(0, 'Fee must be a positive number.'),
  challanNo: z.string().min(1, 'Challan number is required.'),
  challanDate: z.string().min(1, 'Challan date is required.'),
  electricalContractorName: z.string().min(1, 'Contractor name is required.'),
  remarks: z.string().optional(),
});

export default function EditReportPage() {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const { id: uin } = params; // This is the UIN
  const [report, setReport] = useState<TestReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

   useEffect(() => {
    if (!firestore || typeof uin !== 'string' || !user) {
      if(!user && firestore) setIsLoading(false); // Not logged in
      return;
    }

    const findReport = async () => {
      setIsLoading(true);
      try {
        // Admins and users who created the report can edit, so we query the collection group.
        const reportsRef = collectionGroup(firestore, 'testReports');
        const q = query(reportsRef, where('uin', '==', uin));
        
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const reportData = { ...(doc.data() as TestReport), id: doc.id };
          setReport(reportData);

          // Handle challanDate which could be a string, Date, or Firestore Timestamp
          const challanDate = reportData.challanDate;
          let formattedChallanDate = '';
          if (challanDate) {
            if (challanDate instanceof Timestamp) {
              formattedChallanDate = format(challanDate.toDate(), 'yyyy-MM-dd');
            } else if (challanDate instanceof Date) {
              formattedChallanDate = format(challanDate, 'yyyy-MM-dd');
            } else if (typeof challanDate === 'string') {
              try {
                 // Attempt to parse string dates, common format is ISO string
                formattedChallanDate = format(parseISO(challanDate), 'yyyy-MM-dd');
              } catch {
                // If parsing fails, it might be in 'yyyy-MM-dd' already
                formattedChallanDate = challanDate;
              }
            }
          }

          form.reset({
            ...reportData,
            challanDate: formattedChallanDate,
            remarks: reportData.remarks || '',
            governmentFee: reportData.governmentFee || 0,
            sanctionedLoad: reportData.sanctionedLoad?.toString() || '',
          });

        } else {
          setReport(null);
        }
      } catch (error) {
        console.error("Error fetching report for editing:", error);
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: `testReports where uin == ${uin}`,
        });
        errorEmitter.emit('permission-error', contextualError);
        setReport(null);
      } finally {
        setIsLoading(false);
      }
    };

    findReport();
  }, [firestore, uin, form, user]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user || !report) {
      toast({ variant: "destructive", title: "Error", description: "Could not update report." });
      return;
    }
    
    // The path requires the original creator's UID (`enteredBy`) and the report's actual document ID.
    const reportRef = doc(firestore, 'users', report.enteredBy, 'testReports', report.id);
    
    const updateData = {
        ...values,
        challanDate: values.challanDate ? new Date(values.challanDate) : new Date()
    };
    
    updateDocumentNonBlocking(reportRef, updateData);

    toast({
      title: 'Report Updated',
      description: `Report with UIN ${values.uin} has been successfully updated.`,
    });
    router.push('/dashboard/reports');
  }

  if (isLoading) {
      return <div>Loading report for editing...</div>
  }

  if (!report) {
      return notFound();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Test Report</CardTitle>
        <CardDescription>Update the details for report with UIN: <span className="font-mono bg-muted p-1 rounded">{report.uin}</span></CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
                control={form.control}
                name="uin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unique Identification Number (UIN)</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormDescription>UIN cannot be changed after creation.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="grid md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="applicantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicant Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="electricalContractorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Electrical Contractor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Reliable Electrics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="shortAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Address</FormLabel>
                    <FormControl>
                      <Input placeholder="House 123, Street 4, City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    <FormControl>
                      <Input placeholder="Bannu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Domestic">Domestic</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Industrial">Industrial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sanctionedLoad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sanctioned Load (in kW or kVA)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 5 kW" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="proposedTransformer"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Proposed Transformer</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex items-center space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="No" />
                          </FormControl>
                          <FormLabel className="font-normal">No</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Yes" />
                          </FormControl>
                          <FormLabel className="font-normal">Yes</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Input
                              className="w-auto"
                              placeholder="kVA Value"
                              value={field.value !== 'Yes' && field.value !== 'No' ? field.value : ''}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FormField
                control={form.control}
                name="governmentFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Government Fee (Rs)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="challanNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Challan No.</FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="challanDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Challan Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks / Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional comments..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
