// src/lib/utils/comparison.ts
import { Property } from '@/lib/types/property'

export class ComparisonUtils {
  static canAddToComparison(currentCount: number): boolean {
    return currentCount < 10
  }

  static formatComparisonData(properties: Property[], matrix?: Record<string, any[]>) {
    if (!properties || properties.length === 0) {
      return {
        fields: [],
        properties: [],
        matrix: {},
        stats: null
      }
    }

    const defaultFields = [
      'title',
      'price_etb',
      'monthly_rent',
      'total_area',
      'bedrooms',
      'bathrooms',
      'property_type',
      'city',
      'sub_city',
      'price_per_sqm',
      'days_on_market',
      'built_year',
      'is_verified',
    ]

    if (!matrix) {
      // Create matrix from properties
      matrix = {}
      defaultFields.forEach(field => {
        matrix![field] = properties.map(prop => {
          let value = prop[field as keyof Property]
          if (value && typeof value === 'object' && 'name' in value) {
            return (value as any).name
          }
          return value !== undefined && value !== null ? value : '-'
        })
      })
    }

    return {
      fields: defaultFields,
      properties,
      matrix,
      stats: this.calculateComparisonStats(properties)
    }
  }

  static calculateComparisonStats(properties: Property[]) {
    if (!properties || properties.length === 0) return null

    const prices = properties.map(p => p.price_etb || 0)
    const areas = properties.map(p => p.total_area || 0)
    const pricePerSqm = properties.map(p => p.price_per_sqm || 0)
    const bedrooms = properties.map(p => p.bedrooms || 0)

    return {
      price: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.reduce((a, b) => a + b, 0) / prices.length,
        range: Math.max(...prices) - Math.min(...prices)
      },
      area: {
        min: Math.min(...areas),
        max: Math.max(...areas),
        avg: areas.reduce((a, b) => a + b, 0) / areas.length,
        range: Math.max(...areas) - Math.min(...areas)
      },
      pricePerSqm: {
        min: Math.min(...pricePerSqm),
        max: Math.max(...pricePerSqm),
        avg: pricePerSqm.reduce((a, b) => a + b, 0) / pricePerSqm.length,
        bestValue: properties[pricePerSqm.indexOf(Math.min(...pricePerSqm))]
      },
      bedrooms: {
        min: Math.min(...bedrooms),
        max: Math.max(...bedrooms),
        mostCommon: this.mode(bedrooms)
      }
    }
  }

  private static mode(arr: number[]): number {
    if (arr.length === 0) return 0
    
    const counts: Record<number, number> = {}
    let maxCount = 0
    let mode = arr[0]

    arr.forEach(num => {
      counts[num] = (counts[num] || 0) + 1
      if (counts[num] > maxCount) {
        maxCount = counts[num]
        mode = num
      }
    })

    return mode
  }

  static generateComparisonRecommendations(properties: Property[]) {
    if (!properties || properties.length === 0) {
      return []
    }

    const recommendations = []

    // Calculate averages
    const avgPrice = properties.reduce((sum, p) => sum + (p.price_etb || 0), 0) / properties.length
    const avgPricePerSqm = properties.reduce((sum, p) => sum + (p.price_per_sqm || 0), 0) / properties.length

    // Find best values - add initial value for reduce
    const bestValueProperty = properties.length > 0 ? properties.reduce((best, current) => {
      if (!best) return current
      const currentRatio = (current.price_per_sqm || 0)
      const bestRatio = (best.price_per_sqm || 0)
      return currentRatio < bestRatio ? current : best
    }) : null

    const mostFeaturesProperty = properties.length > 0 ? properties.reduce((most, current) => {
      if (!most) return current
      const currentFeatures = current.key_features?.length || 0
      const mostFeatures = most.key_features?.length || 0
      return currentFeatures > mostFeatures ? current : most
    }) : null

    // Generate recommendations
    properties.forEach(property => {
      if (property.price_etb && property.price_etb < avgPrice * 0.85) {
        recommendations.push({
          type: 'good_value',
          property_id: property.id,
          title: property.title,
          message: `Good value - priced ${((1 - (property.price_etb / avgPrice)) * 100).toFixed(1)}% below average`
        })
      }

      if (property.is_verified && property.days_on_market && property.days_on_market > 60) {
        recommendations.push({
          type: 'negotiation_opportunity',
          property_id: property.id,
          title: property.title,
          message: 'On market for 60+ days - good negotiation opportunity'
        })
      }
    })

    // Add best value recommendation
    if (bestValueProperty) {
      recommendations.push({
        type: 'best_value',
        property_id: bestValueProperty.id,
        title: bestValueProperty.title,
        message: 'Best value for money (lowest price per square meter)'
      })
    }

    // Add most features recommendation
    if (mostFeaturesProperty && mostFeaturesProperty.key_features && mostFeaturesProperty.key_features.length > 0) {
      recommendations.push({
        type: 'most_features',
        property_id: mostFeaturesProperty.id,
        title: mostFeaturesProperty.title,
        message: `Most features: ${mostFeaturesProperty.key_features.length} key amenities`
      })
    }

    return recommendations
  }

  static exportComparisonToCSV(properties: Property[], matrix: Record<string, any[]>) {
    if (!properties || properties.length === 0) {
      return ''
    }

    const headers = ['Property'].concat(properties.map(p => p.title || `Property ${p.id}`))
    const csvRows = [headers.join(',')]

    Object.entries(matrix).forEach(([field, values]) => {
      const row = [field].concat(values.map(v => {
        if (typeof v === 'string') {
          return `"${v.replace(/"/g, '""')}"`
        }
        return v === null || v === undefined ? '' : v
      }))
      csvRows.push(row.join(','))
    })

    return csvRows.join('\n')
  }

  static exportComparisonToJSON(properties: Property[], matrix: Record<string, any[]>) {
    if (!properties || properties.length === 0) {
      return JSON.stringify({
        properties: [],
        matrix: {},
        comparison_date: new Date().toISOString(),
        stats: null
      }, null, 2)
    }

    return JSON.stringify({
      properties: properties.map(p => ({
        id: p.id,
        title: p.title,
        price: p.price_etb,
        area: p.total_area,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms
      })),
      matrix,
      comparison_date: new Date().toISOString(),
      stats: this.calculateComparisonStats(properties)
    }, null, 2)
  }
}