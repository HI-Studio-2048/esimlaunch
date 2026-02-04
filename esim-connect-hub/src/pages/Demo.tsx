import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  Clock,
  Users,
  Building2,
  CheckCircle,
  Video,
  Globe,
  Headphones,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const demoSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  company: z.string().min(2, "Company name is required"),
  companySize: z.string().min(1, "Please select company size"),
  useCase: z.string().min(1, "Please select a use case"),
  currentSolution: z.string().optional(),
  goals: z.string().optional(),
  preferredTime: z.string().min(1, "Please select a time slot"),
});

type DemoFormData = z.infer<typeof demoSchema>;

const companySizes = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "500+", label: "500+ employees" },
];

const useCases = [
  { value: "travel-agency", label: "Travel Agency" },
  { value: "telecom", label: "Telecom / MVNO" },
  { value: "corporate-travel", label: "Corporate Travel Management" },
  { value: "saas-platform", label: "SaaS Platform Integration" },
  { value: "mobile-app", label: "Mobile App" },
  { value: "other", label: "Other" },
];

const timeSlots = [
  "9:00 AM - 9:30 AM",
  "10:00 AM - 10:30 AM",
  "11:00 AM - 11:30 AM",
  "1:00 PM - 1:30 PM",
  "2:00 PM - 2:30 PM",
  "3:00 PM - 3:30 PM",
  "4:00 PM - 4:30 PM",
];

const benefits = [
  {
    icon: Video,
    title: "Live Product Demo",
    description: "See eSIMLaunch in action with a personalized walkthrough",
  },
  {
    icon: Headphones,
    title: "Q&A Session",
    description: "Get all your questions answered by our product experts",
  },
  {
    icon: Globe,
    title: "Custom Solutions",
    description: "Discuss how eSIMLaunch can fit your specific business needs",
  },
];

export default function Demo() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<DemoFormData>({
    resolver: zodResolver(demoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      companySize: "",
      useCase: "",
      currentSolution: "",
      goals: "",
      preferredTime: "",
    },
  });

  const onSubmit = async (data: DemoFormData) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    console.log("Demo request:", { ...data, selectedDate });
    
    setIsSubmitted(true);
    toast({
      title: "Demo Scheduled!",
      description: "We'll send you a calendar invite shortly.",
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-display mb-4">Demo Scheduled!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your interest in eSIMLaunch. We've received your demo request
            and will send you a calendar invite at <strong>{form.getValues("email")}</strong> shortly.
          </p>
          {selectedDate && (
            <p className="text-sm text-muted-foreground mb-8">
              Scheduled for: <strong>{format(selectedDate, "MMMM d, yyyy")}</strong> at{" "}
              <strong>{form.getValues("preferredTime")}</strong>
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <a href="/">Return Home</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/features">Explore Features</a>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden mb-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <CalendarDays className="h-4 w-4" />
              Book a Demo
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display mb-6">
              See eSIMLaunch{" "}
              <span className="gradient-text">in Action</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Schedule a personalized demo with our product experts and discover
              how eSIMLaunch can transform your eSIM business.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container-custom mb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <benefit.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Form Section */}
      <section className="container-custom">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Select a Date
                </CardTitle>
                <CardDescription>
                  Choose your preferred date for the demo call
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const day = date.getDay();
                    // Disable past dates and weekends
                    return date < today || day === 0 || day === 6;
                  }}
                  className="rounded-md border pointer-events-auto"
                />
                {selectedDate && (
                  <div className="mt-4 p-3 rounded-lg bg-primary/10 text-sm">
                    <p className="font-medium text-primary">
                      Selected: {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
                <CardDescription>
                  Tell us about yourself and your business needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Name Row */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Email</FormLabel>
                          <FormControl>
                            <Input placeholder="john@company.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Company Row */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Acme Inc" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="companySize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Size</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {companySizes.map((size) => (
                                  <SelectItem key={size.value} value={size.value}>
                                    {size.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Use Case & Time */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="useCase"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Use Case</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select use case" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {useCases.map((useCase) => (
                                  <SelectItem key={useCase.value} value={useCase.value}>
                                    {useCase.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="preferredTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Time (EST)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeSlots.map((slot) => (
                                  <SelectItem key={slot} value={slot}>
                                    {slot}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Optional Fields */}
                    <FormField
                      control={form.control}
                      name="currentSolution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current eSIM Solution (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Airalo, Custom solution, None" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="goals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What are you hoping to achieve? (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us about your goals and any specific questions you'd like us to address during the demo..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      variant="gradient"
                      size="lg"
                      className="w-full"
                      disabled={!selectedDate || form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        "Scheduling..."
                      ) : (
                        <>
                          Schedule Demo
                          <CalendarDays className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    {!selectedDate && (
                      <p className="text-sm text-muted-foreground text-center">
                        Please select a date from the calendar to continue
                      </p>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
