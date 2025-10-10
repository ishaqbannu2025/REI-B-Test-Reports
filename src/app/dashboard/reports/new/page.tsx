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
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useFirebase, useUser, setDocumentNonBlocking } from '@/firebase';
import {
  collection,
  query,
  where,
  getCountFromServer,
  serverTimestamp,
  doc,
} from 'firebase/firestore';

const formSchema = z.object({
  uin: z.string().min(1, 'UIN is required.'),
  applicantName: z.string().min(1, 'Applicant name is required.'),
  shortAddress: z.string().min(1, 'Address is required.'),
  district: z.string().min(1, 'District is required.'),
  category: z.enum(['Domestic', 'Commercial', 'Industrial']),
  sanctionedLoad: z.string().min(1, 'Sanctioned load is required.'),
  proposedTransformer: z.string().min(1, 'Transformer info is required.'),
  governmentFee: z.coerce.number().min(0, 'Fee must be a positive number.'),
  challan: z.string().min(1, 'Challan number/date is required.'),
  electricalContractorName: z.string().min(1, 'Contractor name is required.'),
  remarks: z.string().optional(),
});

export default function NewReportPage() {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [uinExists, setUinExists] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      uin: '',
      applicantName: '',
      shortAddress: '',
      district: 'Bannu',
      category: 'Domestic',
      sanctionedLoad: '',
      proposedTransformer: 'No',
      governmentFee: 0,
      challan: '',
      electricalContractorName: '',
      remarks: '',
    },
  });

  async function handleUinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const uin = e.target.value;
    form.setValue('uin', uin);
    // Note: This check is not exhaustive if UINs are unique across all users,
    // as it only checks the current user's reports. A backend check would be needed
    // for global uniqueness.
    if (firestore && user && uin) {
      const reportRef = doc(firestore, 'users', user.uid, 'testReports', uin);
      // A getDoc is more efficient than getCountFromServer for a single doc check.
      // However, for simplicity and to stick with existing patterns:
      const userReportsRef = collection(firestore, 'users', user.uid, 'testReports');
      const q = query(userReportsRef, where('uin', '==', uin));
      const snapshot = await getCountFromServer(q);
      setUinExists(snapshot.data().count > 0);
    } else {
      setUinExists(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (uinExists) {
      toast({
        variant: 'destructive',
        title: 'Duplicate UIN',
        description: 'A report with this UIN already exists for you. Please enter a unique UIN.',
      });
      return;
    }
    if (!firestore || !user) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in to create a report." });
        return;
    }

    // A single report object.
    const reportData = {
        ...values,
        id: values.uin, // Explicitly set id to match uin
        entryDate: serverTimestamp(),
        enteredBy: user.uid,
    };
    
    // The only write operation is to the user's own subcollection.
    const userReportRef = doc(firestore, 'users', user.uid, 'testReports', values.uin);
    setDocumentNonBlocking(userReportRef, reportData, { merge: true });

    toast({
      title: 'Report Submitted',
      description: `Report with UIN ${values.uin} has been successfully created.`,
    });
    form.reset();
    setUinExists(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Test Report</CardTitle>
        <CardDescription>Fill in the details below to add a new report to the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="uin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unique Identification Number (UIN)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., REI-BNU-2025-0012"
                        {...field}
                        onChange={handleUinChange}
                      />
                    </FormControl>
                    <FormDescription>Manually enter the UIN for this report.</FormDescription>
                    <FormMessage />
                    {uinExists && (
                      <Alert variant="destructive">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Duplicate UIN Warning</AlertTitle>
                        <AlertDescription>A report with this UIN already exists.</AlertDescription>
                      </Alert>
                    )}
                  </FormItem>
                )}
              />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        defaultValue={field.value}
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
                name="challan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Challan No. / Date</FormLabel>
                    <FormControl>
                      <Input placeholder="12345 / 2025-01-10" {...field} />
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
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Clear
              </Button>
              <Button type="submit">Submit Report</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
