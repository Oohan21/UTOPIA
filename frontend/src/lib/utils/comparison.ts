// lib/utils/comparison.ts
import { Property } from '@/lib/types/property'

export interface ComparisonStats {
  price: {
    min: number
    max: number
    avg: number
    median: number
  }
  area: {
    min: number
    max: number
    avg: number
  }
  pricePerSqm: {
    min: number
    max: number
    avg: number
    bestValue?: Property
  }
  bedrooms: {
    min: number
    max: number
    avg: number
    mostCommon: number
  }
  amenities: {
    avg: number
    mostCommon: string[]
    topFeatures: string[]
  }
}

export interface ComparisonData {
  matrix: Record<string, any[]>
  summary: {
    propertyCount: number
    fields: string[]
  }
}

export class ComparisonUtils {
  static formatComparisonData(properties: Property[]): ComparisonData {
    if (!properties || properties.length === 0) {
      return { matrix: {}, summary: { propertyCount: 0, fields: [] } }
    }

    const comparisonFields = [
      'price_etb',
      'total_area',
      'bedrooms',
      'bathrooms',
      'property_type',
      'listing_type',
      'city',
      'sub_city',
      'has_parking',
      'has_garden',
      'has_security',
      'has_furniture',
      'has_air_conditioning',
      'has_elevator',
      'is_pet_friendly',
      'virtual_tour_url',
      'is_verified',
      'is_featured',
      'days_on_market',
      'views_count',
      'save_count',
      'built_year',
      'price_per_sqm',
      'monthly_rent',
      'rent_per_sqm',
    ]

    const matrix: Record<string, any[]> = {}

    for (const field of comparisonFields) {
      matrix[field] = []
      for (const property of properties) {
        let value: any

        if (field.includes('city') || field.includes('sub_city')) {
          const parts = field.split('_')
          const obj = parts[0] === 'city' ? property.city : property.sub_city
          value = obj ? obj.name : null
        } else if (field in property) {
          // @ts-ignore - we know these fields exist
          value = (property as any)[field]
        } else if (field === 'days_on_market') {
          value = (property as any).days_on_market || 0
        } else if (field === 'price_per_sqm') {
          value = property.price_etb && property.total_area
            ? Math.round(property.price_etb / property.total_area)
            : 0
        } else if (field === 'rent_per_sqm') {
          value = property.monthly_rent && property.total_area
            ? Math.round(property.monthly_rent / property.total_area)
            : 0
        } else {
          value = null
        }

        matrix[field].push(value)
      }
    }

    return {
      matrix,
      summary: {
        propertyCount: properties.length,
        fields: comparisonFields,
      }
    }
  }

  static calculateComparisonStats(properties: Property[]): ComparisonStats | null {
    if (!properties || properties.length === 0) {
      return null
    }

    // Price statistics
    const prices = properties.map(p => p.price_etb || 0).filter(p => p > 0)
    const priceMin = prices.length > 0 ? Math.min(...prices) : 0
    const priceMax = prices.length > 0 ? Math.max(...prices) : 0
    const priceAvg = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
    const priceMedian = prices.length > 0 ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] : 0

    // Area statistics
    const areas = properties.map(p => p.total_area || 0).filter(a => a > 0)
    const areaMin = areas.length > 0 ? Math.min(...areas) : 0
    const areaMax = areas.length > 0 ? Math.max(...areas) : 0
    const areaAvg = areas.length > 0 ? areas.reduce((a, b) => a + b, 0) / areas.length : 0

    // Price per square meter
    const pricePerSqmList = properties.map(p => {
      if (p.price_etb && p.total_area && p.total_area > 0) {
        return {
          property: p,
          value: p.price_etb / p.total_area
        }
      }
      return null
    }).filter(Boolean) as Array<{ property: Property, value: number }>

    const pricePerSqmValues = pricePerSqmList.map(p => p.value)
    const pricePerSqmMin = pricePerSqmValues.length > 0 ? Math.min(...pricePerSqmValues) : 0
    const pricePerSqmMax = pricePerSqmValues.length > 0 ? Math.max(...pricePerSqmValues) : 0
    const pricePerSqmAvg = pricePerSqmValues.length > 0 ?
      pricePerSqmValues.reduce((a, b) => a + b, 0) / pricePerSqmValues.length : 0
    const bestValue = pricePerSqmList.length > 0 ?
      pricePerSqmList.reduce((a, b) => a.value < b.value ? a : b)?.property : undefined

    // Bedroom statistics
    const bedrooms = properties.map(p => p.bedrooms || 0)
    const bedroomMin = bedrooms.length > 0 ? Math.min(...bedrooms) : 0
    const bedroomMax = bedrooms.length > 0 ? Math.max(...bedrooms) : 0
    const bedroomAvg = bedrooms.length > 0 ? bedrooms.reduce((a, b) => a + b, 0) / bedrooms.length : 0

    // Find most common number of bedrooms
    const bedroomFrequency = bedrooms.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1
      return acc
    }, {} as Record<number, number>)
    const mostCommonBedrooms = Object.entries(bedroomFrequency)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || bedroomAvg

    // Amenities statistics
    const amenityCounts = properties.map(p => {
      const amenities: string[] = []
      if (p.has_parking) amenities.push('Parking')
      if (p.has_garden) amenities.push('Garden')
      if (p.has_security) amenities.push('Security')
      if (p.has_furniture) amenities.push('Furnished')
      if (p.has_air_conditioning) amenities.push('Air Conditioning')
      if (p.has_elevator) amenities.push('Elevator')
      if (p.is_pet_friendly) amenities.push('Pet Friendly')
      return amenities
    })

    const avgAmenities = amenityCounts.length > 0 ?
      amenityCounts.reduce((a, b) => a + b.length, 0) / amenityCounts.length : 0

    // Find most common amenities
    const amenityFrequency = amenityCounts.flat().reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostCommonAmenities = Object.entries(amenityFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([amenity]) => amenity)

    const topFeatures = Object.entries(amenityFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([amenity]) => amenity)

    return {
      price: {
        min: priceMin,
        max: priceMax,
        avg: priceAvg,
        median: priceMedian,
      },
      area: {
        min: areaMin,
        max: areaMax,
        avg: areaAvg,
      },
      pricePerSqm: {
        min: pricePerSqmMin,
        max: pricePerSqmMax,
        avg: pricePerSqmAvg,
        bestValue: bestValue,
      },
      bedrooms: {
        min: bedroomMin,
        max: bedroomMax,
        avg: bedroomAvg,
        mostCommon: Number(mostCommonBedrooms),
      },
      amenities: {
        avg: avgAmenities,
        mostCommon: mostCommonAmenities,
        topFeatures: topFeatures,
      }
    }
  }

  static generateComparisonRecommendations(properties: Property[]) {
    if (!properties || properties.length < 2) {
      return []
    }

    const stats = this.calculateComparisonStats(properties)
    if (!stats) return []

    const recommendations = []

    // Best value recommendation
    if (stats.pricePerSqm.bestValue) {
      recommendations.push({
        type: 'best_value' as const,
        title: 'Best Value Property',
        message: `Property "${stats.pricePerSqm.bestValue.title?.slice(0, 30)}..." offers the best price per square meter at ${Math.round(stats.pricePerSqm.avg).toLocaleString()} ETB/m²`,
        priority: 'high' as const,
        suggestion: 'Consider this property for the best value for money',
      })
    }

    // Price range recommendation
    const priceRange = stats.price.max - stats.price.min
    if (priceRange > stats.price.avg * 0.3) { // If range is more than 30% of average
      recommendations.push({
        type: 'price_variance' as const,
        title: 'High Price Variance',
        message: `Properties vary significantly in price (${(priceRange / stats.price.avg * 100).toFixed(0)}% difference)`,
        priority: 'medium' as const,
        suggestion: 'Consider negotiating with higher-priced properties',
      })
    }

    // Amenities leader
    const amenitiesCount = properties.map(p => {
      let count = 0
      if (p.has_parking) count++
      if (p.has_garden) count++
      if (p.has_security) count++
      if (p.has_furniture) count++
      if (p.has_air_conditioning) count++
      return count
    })

    const maxAmenitiesIndex = amenitiesCount.indexOf(Math.max(...amenitiesCount))
    if (maxAmenitiesIndex !== -1 && amenitiesCount[maxAmenitiesIndex] > 0) {
      const prop = properties[maxAmenitiesIndex]
      recommendations.push({
        type: 'most_features' as const,
        title: 'Most Feature-Rich',
        message: `Property "${prop.title?.slice(0, 30)}..." has the most amenities (${amenitiesCount[maxAmenitiesIndex]})`,
        priority: 'medium' as const,
        suggestion: 'Ideal if amenities are a priority',
      })
    }

    // Newest property
    const newestProperty = properties.reduce((newest, current) => {
      if (!newest.listed_date) return current
      if (!current.listed_date) return newest
      return new Date(current.listed_date) > new Date(newest.listed_date) ? current : newest
    })

    if (newestProperty) {
      const daysOnMarket = (newestProperty as any).days_on_market || 0
      if (daysOnMarket < 7) {
        recommendations.push({
          type: 'new_listing' as const,
          title: 'New Listing',
          message: `Property "${newestProperty.title?.slice(0, 30)}..." was listed ${daysOnMarket} days ago`,
          priority: 'low' as const,
          suggestion: 'Act fast as new listings tend to get attention quickly',
        })
      }
    }

    return recommendations
  }

  static getPropertyScore(property: Property, criteria: any = {}): number {
    let score = 0
    const maxScore = 100

    // Price score (lower is better)
    if (property.price_etb) {
      const priceWeight = criteria.price_weight || 0.4
      // This is simplified - in reality you'd compare against market average
      const normalizedPrice = Math.min(property.price_etb / 10000000, 1)
      score += (1 - normalizedPrice) * 40 * priceWeight
    }

    // Area score (larger is better, but not too large)
    if (property.total_area) {
      const areaWeight = criteria.area_weight || 0.2
      const normalizedArea = Math.min(property.total_area / 500, 1) // Cap at 500m²
      score += normalizedArea * 20 * areaWeight
    }

    // Amenities score
    const amenitiesWeight = criteria.features_weight || 0.3
    let amenitiesScore = 0
    if (property.has_parking) amenitiesScore += 2
    if (property.has_security) amenitiesScore += 2
    if (property.has_air_conditioning) amenitiesScore += 1.5
    if (property.has_furniture) amenitiesScore += 1.5
    if (property.has_garden) amenitiesScore += 1
    if (property.has_elevator) amenitiesScore += 1
    if (property.is_pet_friendly) amenitiesScore += 0.5
    score += (amenitiesScore / 10) * 30 * amenitiesWeight

    // Location score (simplified)
    const locationWeight = criteria.location_weight || 0.1
    // In reality, this would use geospatial data
    score += 10 * locationWeight

    return Math.min(Math.max(score, 0), maxScore)
  }
}