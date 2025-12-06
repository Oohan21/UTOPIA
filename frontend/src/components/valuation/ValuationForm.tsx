'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { valuationApi } from '@/lib/api/valuation'
import { listingsApi } from '@/lib/api/listings'
import { useQuery } from '@tanstack/react-query'
import { PROPERTY_TYPES } from '@/lib/utils/constants'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Loader2 } from 'lucide-react'
import { City, SubCity } from '@/lib/types/property'

const valuationSchema = z.object({
  property_type: z.string().min(1, 'Property type is required'),
  bedrooms: z.number().min(1, 'Minimum 1 bedroom'),
  total_area: z.number().min(1, 'Area is required'),
  built_year: z.number().optional(),
  condition: z.enum(['excellent', 'good', 'average', 'needs_work']),
  city: z.number().optional(),
  sub_city: z.number().optional(),
  has_parking: z.boolean().optional(),
  has_security: z.boolean().optional(),
  has_garden: z.boolean().optional(),
  has_furniture: z.boolean().optional(),
})

type ValuationFormData = z.infer<typeof valuationSchema>

interface ValuationFormProps {
  onValuationComplete?: (result: any) => void
}

export default function ValuationForm({ onValuationComplete }: ValuationFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ValuationFormData>({
    resolver: zodResolver(valuationSchema),
    defaultValues: {
      property_type: '',
      bedrooms: 3,
      total_area: 120,
      condition: 'good',
    },
  })

  const selectedCity = watch('city')

  // Fetch cities
  const { data: citiesData, isLoading: isLoadingCities } = useQuery({
    queryKey: ['cities'],
    queryFn: () => listingsApi.getCities(),
  })

  // Cast to City array - API returns array directly, not { results: [] }
  const cities: City[] = Array.isArray(citiesData) ? citiesData : []

  // Fetch sub-cities when city is selected
  const { data: subCitiesData, isLoading: isLoadingSubCities } = useQuery({
    queryKey: ['subCities', selectedCity],
    queryFn: () => listingsApi.getSubCities(selectedCity),
    enabled: !!selectedCity,
  })

  // Cast to SubCity array - API returns array directly
  const subCities: SubCity[] = Array.isArray(subCitiesData) ? subCitiesData : []

  const cityOptions = cities.map((city) => ({
    value: city.id.toString(),
    label: city.name,
  }))

  const subCityOptions = subCities.map((subCity) => ({
    value: subCity.id.toString(),
    label: subCity.name,
  }))

  const onSubmit = async (data: ValuationFormData) => {
    setIsLoading(true)
    try {
      const result = await valuationApi.getValuation(data)
      onValuationComplete?.(result)
    } catch (error) {
      console.error('Valuation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Valuation</CardTitle>
        <p className="text-sm text-muted-foreground">
          Get an instant valuation based on market data
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Property Type */}
            <Select
              label="Property Type"
              value={watch('property_type')}
              onValueChange={(value) => setValue('property_type', value)}
              error={errors.property_type?.message}
              options={PROPERTY_TYPES}
              required
              disabled={isLoading}
            />

            {/* Location */}
            <Select
              label="City"
              value={watch('city')?.toString()}
              onValueChange={(value) => setValue('city', parseInt(value))}
              options={cityOptions}
              disabled={isLoadingCities || isLoading}
              placeholder={isLoadingCities ? "Loading cities..." : "Select a city"}
            />

            <Select
              label="Sub City"
              value={watch('sub_city')?.toString()}
              onValueChange={(value) => setValue('sub_city', parseInt(value))}
              options={subCityOptions}
              disabled={!selectedCity || isLoadingSubCities || isLoading}
              placeholder={
                !selectedCity 
                  ? "Select a city first" 
                  : isLoadingSubCities 
                  ? "Loading sub-cities..." 
                  : "Select a sub-city"
              }
            />

            {/* Specifications */}
            <Input
              label="Bedrooms"
              type="number"
              {...register('bedrooms', { valueAsNumber: true })}
              error={errors.bedrooms?.message}
              required
              min={1}
              max={20}
              disabled={isLoading}
            />

            <Input
              label="Total Area (m²)"
              type="number"
              {...register('total_area', { valueAsNumber: true })}
              error={errors.total_area?.message}
              required
              min={1}
              step={0.1}
              disabled={isLoading}
            />

            <Input
              label="Built Year"
              type="number"
              {...register('built_year', { valueAsNumber: true })}
              error={errors.built_year?.message}
              min={1900}
              max={new Date().getFullYear()}
              disabled={isLoading}
            />

            {/* Condition */}
            <Select
              label="Property Condition"
              value={watch('condition')}
              onValueChange={(value) => setValue('condition', value as any)}
              options={[
                { value: 'excellent', label: 'Excellent' },
                { value: 'good', label: 'Good' },
                { value: 'average', label: 'Average' },
                { value: 'needs_work', label: 'Needs Work' },
              ]}
              required
              disabled={isLoading}
            />
          </div>

          {/* Features */}
          <div className="rounded-lg border p-4">
            <h4 className="mb-3 font-medium">Features (Optional)</h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('has_parking')}
                  className="h-4 w-4 rounded border-gray-300"
                  disabled={isLoading}
                />
                <span className="text-sm">Parking</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('has_security')}
                  className="h-4 w-4 rounded border-gray-300"
                  disabled={isLoading}
                />
                <span className="text-sm">Security</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('has_garden')}
                  className="h-4 w-4 rounded border-gray-300"
                  disabled={isLoading}
                />
                <span className="text-sm">Garden</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('has_furniture')}
                  className="h-4 w-4 rounded border-gray-300"
                  disabled={isLoading}
                />
                <span className="text-sm">Furnished</span>
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating Valuation...
              </>
            ) : (
              'Get Instant Valuation'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}