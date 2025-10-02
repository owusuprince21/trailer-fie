'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { notify } from '@/lib/notify';

const newsletterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type NewsletterForm = z.infer<typeof newsletterSchema>;

export default function Newsletter() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NewsletterForm>({
    resolver: zodResolver(newsletterSchema),
  });

  const onSubmit = async (data: NewsletterForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        notify({
          title: 'Subscribed!',
          description: "You've been added to our newsletter.",
          variant: 'success',
        });
        reset();
        setAlreadySubscribed(true);
      } else {
        const { error } = await response.json();
        if (response.status === 409) {
          notify({
            title: 'Already Subscribed',
            description: 'You have already subscribed with this email.',
            variant: 'success',
          });
          setAlreadySubscribed(true);
        } else {
          notify({
            title: 'Subscription failed',
            description: error || 'Please try again later.',
            variant: 'error',
          });
        }
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      notify({
        title: 'Error',
        description: 'Something went wrong. Try again later.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
      <div className="max-w-4xl mx-auto text-center px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Stay Updated with Latest Trailers
        </h2>
        <p className="text-xl text-blue-100 mb-8">
          Subscribe to our newsletter and never miss a new trailer release
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Enter your email address"
                {...register('email')}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/70
                           text-base md:text-sm"
                disabled={alreadySubscribed}
              />
              {errors.email && (
                <p className="text-red-300 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || alreadySubscribed}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              {alreadySubscribed
                ? 'Already Subscribed'
                : isSubmitting
                ? 'Subscribing…'
                : 'Subscribe'}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
