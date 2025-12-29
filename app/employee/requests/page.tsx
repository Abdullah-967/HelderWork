'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useMyRequests } from '@/lib/hooks/use-requests'
import { useSubmitRequest } from '@/lib/mutations/requests'
import { requestSchema, type RequestFormData } from '@/lib/utils/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FileText, Clock, Send } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'motion/react'
import { hoverLiftVariants, fastTransition, staggerContainerVariants, slideUpVariants } from '@/lib/utils/motion'

export default function RequestsPage() {
  const { data: requests, isLoading } = useMyRequests()
  const submitRequest = useSubmitRequest()

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      requests: '',
    },
  })

  // Sync form with data when it loads
  useEffect(() => {
    if (requests && requests.length > 0) {
      form.reset({ requests: requests[0].requests })
    }
  }, [requests, form])

  const onSubmit = (data: RequestFormData) => {
    submitRequest.mutate(data)
  }

  const latestRequest = requests?.[0]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-[150px] w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Availability Requests</h1>
        <p className="text-muted-foreground">
          Submit your shift preferences and availability to your manager
        </p>
      </div>

      <motion.div
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={staggerContainerVariants}
      >
        {/* Submit Request Form */}
        <motion.div variants={slideUpVariants} whileHover={hoverLiftVariants.hover} transition={fastTransition}>
          <Card>
        <CardHeader>
          <CardTitle>Submit Availability</CardTitle>
          <CardDescription>
            Let your manager know your preferred shifts and availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="requests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Availability</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Example: Available Monday-Wednesday mornings, prefer Thursday-Friday evenings. Cannot work Saturdays."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Be specific about your availability, preferred days, and any constraints
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={submitRequest.isPending}>
                <Send className="h-4 w-4 mr-2" />
                {submitRequest.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      </motion.div>

      {/* Current Request */}
      {latestRequest && (
        <motion.div variants={slideUpVariants} whileHover={hoverLiftVariants.hover} transition={fastTransition}>
          <Card>
          <CardHeader>
            <CardTitle>Current Request</CardTitle>
            <CardDescription>
              Your latest submitted availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Last updated: {new Date(latestRequest.updated_at).toLocaleString()}
              </div>

              <div className="rounded-md bg-muted p-4">
                <p className="text-sm whitespace-pre-wrap">{latestRequest.requests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      )}

      {/* Info Card */}
      <motion.div variants={slideUpVariants} whileHover={hoverLiftVariants.hover} transition={fastTransition}>
        <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">
                Tips for submitting requests
              </p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Be specific about days and times you're available</li>
                <li>Mention any days you cannot work</li>
                <li>Update your availability whenever your schedule changes</li>
                <li>Your manager will use this to assign shifts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      </motion.div>
      </motion.div>
    </div>
  )
}