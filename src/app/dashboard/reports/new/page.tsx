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
import { useState, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useUser } from '@/firebase';
import debounce from 'lodash.debounce';

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

export default function NewReportPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const [uinExists, setUinExists] = useState(false);
  const [isCheckingUin, setIsCheckingUin] = useState(false);

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
      challanNo: '',
      challanDate: '',
      electricalContractorName: '',
      remarks: '',
    },
  });

  const checkUin = useCallback(
    debounce(async (uin: string) => {
      if (!uin) {
        setUinExists(false);
        setIsCheckingUin(false);
        return;
      }
      setIsCheckingUin(true);
      try {
        const response = await fetch(`/api/check-uin?uin=${encodeURIComponent(uin)}`);
        if (!response.ok) {
          throw new Error('Failed to check UIN on the server.');
        }
        const data = await response.json();
        setUinExists(data.exists);
      } catch (error) {
        console.error("Error checking UIN:", error);
        // Don't block the user, but show a warning toast
        toast({ 
            variant: 'destructive',
            title: 'UIN Check Failed',
            description: 'Could not verify if UIN is unique. Please double-check it before submitting.'
        });
        setUinExists(false); // Assume not-existent to avoid blocking
      } finally {
        setIsCheckingUin(false);
      }
    }, 500), // 500ms debounce delay
    [toast]
  );

  function handleUinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const uin = e.target.value;
    form.setValue('uin', uin);
    checkUin(uin);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (uinExists) {
      toast({
        variant: 'destructive',
        title: 'Duplicate UIN',
        description: 'A report with this UIN already exists. Please enter a unique UIN.',
      });
      return;
    }
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to create a report." });
      return;
    }

    try {
      // POST to server /api/create-report which will use the Admin SDK
      const resp = await fetch('/api/create-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }), // The API will get the user from the session
      });
      const result = await resp.json();

      if (!resp.ok) {
        throw new Error(result.error || `Server responded with status ${resp.status}`);
      }

      toast({ title: 'Report Submitted', description: `Report with UIN ${values.uin} has been successfully created.` });
      form.reset();
      setUinExists(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create report.' });
      console.error('[new/report] create-report error:', error);
    }
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
                    {isCheckingUin && <p>Checking...</p>}
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
                      <Input type="date" placeholder="2025-01-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
