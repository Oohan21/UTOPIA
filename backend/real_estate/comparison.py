# real_estate/comparison.py
from django.db.models import Avg, Min, Max, Count, Q
from decimal import Decimal
import math
from datetime import datetime
from django.utils import timezone

class PropertyComparisonService:
    
    @staticmethod
    def calculate_comprehensive_score(property, properties_list, criteria=None):
        """Calculate comprehensive score with multiple factors"""
        if criteria is None:
            criteria = {}
        
        scores = {
            'price_value': 0,
            'features': 0,
            'location': 0,
            'condition': 0,
            'market_position': 0,
            'documentation': 0,
            'total': 0
        }
        
        weights = {
            'price_value': criteria.get('price_weight', 0.25),
            'features': criteria.get('features_weight', 0.20),
            'location': criteria.get('location_weight', 0.15),
            'condition': criteria.get('condition_weight', 0.15),
            'market_position': criteria.get('market_weight', 0.15),
            'documentation': criteria.get('doc_weight', 0.10),
        }
        
        # Calculate price value score (25%)
        if property.price_etb and property.total_area:
            price_per_sqm = property.price_etb / property.total_area
            all_prices = [p.price_etb / p.total_area for p in properties_list 
                         if p.price_etb and p.total_area]
            
            if all_prices:
                avg_price_sqm = sum(all_prices) / len(all_prices)
                min_price_sqm = min(all_prices)
                
                # Score based on deviation from average
                if price_per_sqm <= min_price_sqm:
                    scores['price_value'] = 100
                elif price_per_sqm <= avg_price_sqm:
                    deviation = (price_per_sqm - min_price_sqm) / (avg_price_sqm - min_price_sqm)
                    scores['price_value'] = 100 - (deviation * 50)
                else:
                    deviation = (price_per_sqm - avg_price_sqm) / avg_price_sqm
                    scores['price_value'] = max(50 - (deviation * 100), 0)
        
        # Calculate features score (20%)
        property_features = property.key_features
        all_features = [p.key_features for p in properties_list]
        max_features = max(len(feats) for feats in all_features) if all_features else 0
        
        if max_features > 0:
            scores['features'] = (len(property_features) / max_features) * 100
        
        # Premium features bonus
        premium_features = ['Security', 'Air Conditioning', 'Elevator', 'Virtual Tour', 'Furnished']
        premium_count = sum(1 for feat in property_features if feat in premium_features)
        scores['features'] += premium_count * 5
        
        # Calculate location score (15%)
        if property.sub_city and property.sub_city.is_popular:
            scores['location'] = 85
        elif property.city and property.city.is_capital:
            scores['location'] = 70
        else:
            scores['location'] = 50
        
        # Add bonus for specific location preferences
        if criteria.get('preferred_locations'):
            if property.sub_city.name in criteria['preferred_locations']:
                scores['location'] = 100
        
        # Calculate condition score (15%)
        if property.built_year:
            age = timezone.now().year - property.built_year
            if age <= 5:
                scores['condition'] = 95
            elif age <= 10:
                scores['condition'] = 80
            elif age <= 20:
                scores['condition'] = 65
            else:
                scores['condition'] = 50
            
            # Bonus for recent renovation
            if hasattr(property, 'last_renovated') and property.last_renovated:
                renovation_age = timezone.now().year - property.last_renovated
                if renovation_age <= 5:
                    scores['condition'] = min(100, scores['condition'] + 20)
        
        # Calculate market position score (15%)
        scores['market_position'] = 50  # Base score
        
        if property.views_count > 100:
            scores['market_position'] += 10
        if property.inquiry_count > 10:
            scores['market_position'] += 15
        if property.save_count > 5:
            scores['market_position'] += 10
        if property.is_featured:
            scores['market_position'] += 15
        
        # Low days on market is good
        if property.days_on_market < 30:
            scores['market_position'] += 10
        elif property.days_on_market > 90:
            scores['market_position'] -= 10
        
        # Calculate documentation score (10%)
        scores['documentation'] = 0
        if property.has_title_deed:
            scores['documentation'] += 40
        if property.has_construction_permit:
            scores['documentation'] += 30
        if property.has_occupancy_certificate:
            scores['documentation'] += 30
        
        # Calculate total weighted score
        total_score = 0
        total_weight = 0
        
        for category in scores:
            if category != 'total':
                total_score += scores[category] * weights[category]
                total_weight += weights[category]
        
        scores['total'] = round(total_score / total_weight if total_weight > 0 else 0, 2)
        
        return scores
    
    @staticmethod
    def generate_detailed_report(properties, criteria=None):
        """Generate detailed comparison report with insights"""
        if len(properties) < 2:
            return None
        
        report = {
            'executive_summary': {},
            'detailed_analysis': {},
            'property_scores': {},
            'recommendations': [],
            'insights': [],
            'risk_assessment': {}
        }
        
        # Calculate scores for each property
        for prop in properties:
            report['property_scores'][prop.id] = {
                'scores': PropertyComparisonService.calculate_comprehensive_score(
                    prop, properties, criteria
                ),
                'key_strengths': [],
                'key_weaknesses': []
            }
        
        # Executive Summary
        report['executive_summary'] = PropertyComparisonService._generate_executive_summary(
            properties, report['property_scores']
        )
        
        # Detailed Analysis
        report['detailed_analysis'] = PropertyComparisonService._generate_detailed_analysis(
            properties
        )
        
        # Recommendations
        report['recommendations'] = PropertyComparisonService._generate_recommendations(
            properties, report['property_scores']
        )
        
        # Insights
        report['insights'] = PropertyComparisonService._generate_insights(
            properties
        )
        
        # Risk Assessment
        report['risk_assessment'] = PropertyComparisonService._assess_risks(
            properties
        )
        
        return report
    
    @staticmethod
    def _generate_executive_summary(properties, property_scores):
        """Generate executive summary"""
        summary = {
            'total_properties': len(properties),
            'price_summary': {
                'range': {
                    'low': min(p.price_etb for p in properties if p.price_etb),
                    'high': max(p.price_etb for p in properties if p.price_etb),
                    'average': sum(p.price_etb for p in properties if p.price_etb) / len([p for p in properties if p.price_etb])
                },
                'best_value': None,
                'most_expensive': None
            },
            'top_performers': [],
            'key_findings': []
        }
        
        # Find best value (price per sqm)
        properties_with_price = [p for p in properties if p.price_etb and p.total_area]
        if properties_with_price:
            best_value = min(properties_with_price, key=lambda p: p.price_etb / p.total_area)
            summary['price_summary']['best_value'] = {
                'id': best_value.id,
                'title': best_value.title[:50],
                'price_per_sqm': round(best_value.price_etb / best_value.total_area, 2)
            }
            
            most_expensive = max(properties_with_price, key=lambda p: p.price_etb / p.total_area)
            summary['price_summary']['most_expensive'] = {
                'id': most_expensive.id,
                'title': most_expensive.title[:50],
                'price_per_sqm': round(most_expensive.price_etb / most_expensive.total_area, 2)
            }
        
        # Top performers by score
        if property_scores:
            sorted_properties = sorted(
                properties, 
                key=lambda p: property_scores[p.id]['scores']['total'], 
                reverse=True
            )[:3]
            
            for prop in sorted_properties:
                summary['top_performers'].append({
                    'id': prop.id,
                    'title': prop.title[:50],
                    'score': property_scores[prop.id]['scores']['total'],
                    'strengths': property_scores[prop.id]['key_strengths'][:2] if property_scores[prop.id]['key_strengths'] else []
                })
        
        # Key findings
        summary['key_findings'] = PropertyComparisonService._identify_key_findings(
            properties
        )
        
        return summary
    
    @staticmethod
    def _generate_detailed_analysis(properties):
        """Generate detailed analysis"""
        analysis = {
            'price_analysis': {
                'per_sqm': {},
                'trends': [],
                'outliers': []
            },
            'feature_analysis': {
                'common_features': [],
                'unique_features': [],
                'feature_coverage': {}
            },
            'location_analysis': {
                'distribution': {},
                'popular_areas': []
            },
            'condition_analysis': {
                'age_distribution': {},
                'renovation_status': {}
            }
        }
        
        # Price analysis
        price_per_sqm_list = []
        for prop in properties:
            if prop.price_etb and prop.total_area:
                price_per_sqm = prop.price_etb / prop.total_area
                price_per_sqm_list.append({
                    'property_id': prop.id,
                    'value': float(price_per_sqm),
                    'deviation': 0  # Will be calculated
                })
        
        if price_per_sqm_list:
            values = [item['value'] for item in price_per_sqm_list]
            avg_value = sum(values) / len(values)
            
            # Calculate deviations
            for item in price_per_sqm_list:
                item['deviation'] = round((item['value'] - avg_value) / avg_value * 100, 1)
            
            analysis['price_analysis']['per_sqm'] = {
                'average': avg_value,
                'min': min(values),
                'max': max(values),
                'standard_deviation': PropertyComparisonService._calculate_std_dev(values),
                'values': price_per_sqm_list
            }
        
        # Feature analysis
        all_features = set()
        property_features = {}
        
        for prop in properties:
            features = prop.key_features
            all_features.update(features)
            property_features[prop.id] = features
        
        # Find common features
        feature_counts = {}
        for feature in all_features:
            count = sum(1 for prop_id, feats in property_features.items() if feature in feats)
            feature_counts[feature] = count
        
        common_threshold = len(properties) * 0.5  # Appears in at least 50% of properties
        analysis['feature_analysis']['common_features'] = [
            feat for feat, count in feature_counts.items() 
            if count >= common_threshold
        ]
        
        # Find unique features
        analysis['feature_analysis']['unique_features'] = [
            feat for feat, count in feature_counts.items() 
            if count == 1
        ]
        
        # Feature coverage
        for prop in properties:
            analysis['feature_analysis']['feature_coverage'][prop.id] = {
                'total_features': len(property_features[prop.id]),
                'common_features': len([f for f in property_features[prop.id] if f in analysis['feature_analysis']['common_features']]),
                'unique_features': len([f for f in property_features[prop.id] if f in analysis['feature_analysis']['unique_features']])
            }
        
        # Location analysis
        city_distribution = {}
        for prop in properties:
            if prop.city:
                city_name = prop.city.name
                city_distribution[city_name] = city_distribution.get(city_name, 0) + 1
        
        analysis['location_analysis']['distribution'] = city_distribution
        
        # Condition analysis
        ages = []
        for prop in properties:
            if prop.built_year:
                age = timezone.now().year - prop.built_year
                ages.append(age)
        
        if ages:
            analysis['condition_analysis']['age_distribution'] = {
                'average_age': sum(ages) / len(ages),
                'min_age': min(ages),
                'max_age': max(ages),
                'recent_count': len([age for age in ages if age <= 5]),
                'old_count': len([age for age in ages if age >= 30])
            }
        
        return analysis
    
    @staticmethod
    def _generate_recommendations(properties, property_scores):
        """Generate enhanced recommendations"""
        recommendations = []
        
        # Price-based recommendations
        avg_price_sqm = PropertyComparisonService._calculate_avg_price_sqm(properties)
        if avg_price_sqm:
            for prop in properties:
                if prop.price_etb and prop.total_area:
                    prop_price_sqm = prop.price_etb / prop.total_area
                    price_ratio = prop_price_sqm / avg_price_sqm
                    
                    if price_ratio < 0.8:
                        recommendations.append({
                            'type': 'best_value',
                            'priority': 'high',
                            'property_id': prop.id,
                            'title': f"Exceptional Value: {prop.title[:30]}...",
                            'message': f"Priced {round((1 - price_ratio) * 100, 1)}% below market average",
                            'metric': 'price_per_sqm',
                            'value': round(prop_price_sqm, 2),
                            'comparison': round(avg_price_sqm, 2),
                            'suggestion': 'Strong candidate for purchase'
                        })
                    elif price_ratio > 1.2:
                        recommendations.append({
                            'type': 'overpriced',
                            'priority': 'medium',
                            'property_id': prop.id,
                            'title': f"Premium Priced: {prop.title[:30]}...",
                            'message': f"Priced {round((price_ratio - 1) * 100, 1)}% above market average",
                            'metric': 'price_per_sqm',
                            'value': round(prop_price_sqm, 2),
                            'comparison': round(avg_price_sqm, 2),
                            'suggestion': 'Consider negotiating or look at justification'
                        })
        
        # Feature-based recommendations
        for prop in properties:
            features = prop.key_features
            premium_feature_count = sum(1 for feat in features if feat in ['Security', 'Air Conditioning', 'Elevator'])
            
            if premium_feature_count >= 3:
                recommendations.append({
                    'type': 'premium_features',
                    'priority': 'high',
                    'property_id': prop.id,
                    'title': f"Premium Features: {prop.title[:30]}...",
                    'message': f"Has {premium_feature_count} premium features",
                    'features': [f for f in features if f in ['Security', 'Air Conditioning', 'Elevator']],
                    'suggestion': 'Ideal for luxury buyers or long-term investment'
                })
        
        # Documentation recommendations
        for prop in properties:
            doc_score = 0
            if prop.has_title_deed:
                doc_score += 1
            if prop.has_construction_permit:
                doc_score += 1
            if prop.has_occupancy_certificate:
                doc_score += 1
            
            if doc_score == 3:
                recommendations.append({
                    'type': 'full_documentation',
                    'priority': 'high',
                    'property_id': prop.id,
                    'title': f"Complete Documentation: {prop.title[:30]}...",
                    'message': "All legal documents available",
                    'suggestion': 'Low legal risk, faster transaction'
                })
            elif doc_score == 0:
                recommendations.append({
                    'type': 'documentation_warning',
                    'priority': 'critical',
                    'property_id': prop.id,
                    'title': f"Documentation Warning: {prop.title[:30]}...",
                    'message': "No legal documents verified",
                    'suggestion': 'High legal risk, require documentation before proceeding'
                })
        
        # Market activity recommendations
        for prop in properties:
            if prop.days_on_market > 90:
                recommendations.append({
                    'type': 'slow_market',
                    'priority': 'medium',
                    'property_id': prop.id,
                    'title': f"Extended Listing: {prop.title[:30]}...",
                    'message': f"On market for {prop.days_on_market} days",
                    'suggestion': 'Potential for negotiation, seller may be motivated'
                })
            
            if prop.views_count > 500 and prop.inquiry_count < 10:
                recommendations.append({
                    'type': 'high_interest',
                    'priority': 'low',
                    'property_id': prop.id,
                    'title': f"High Interest: {prop.title[:30]}...",
                    'message': f"{prop.views_count} views but only {prop.inquiry_count} inquiries",
                    'suggestion': 'Popular listing but may have issues preventing serious inquiries'
                })
        
        # Sort recommendations by priority
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        recommendations.sort(key=lambda x: priority_order.get(x['priority'], 4))
        
        return recommendations
    
    @staticmethod
    def _generate_insights(properties):
        """Generate market and comparison insights"""
        insights = []
        
        # Price distribution insight
        prices = [p.price_etb for p in properties if p.price_etb]
        if len(prices) >= 3:
            price_range = max(prices) - min(prices)
            price_avg = sum(prices) / len(prices)
            
            if price_range > price_avg * 0.5:
                insights.append({
                    'type': 'price_dispersion',
                    'title': 'Significant Price Variation',
                    'description': f"Properties vary by {round(price_range/price_avg*100, 1)}% in price",
                    'implication': 'Market may not be efficiently priced, opportunities for negotiation'
                })
        
        # Feature concentration insight
        all_features = []
        for prop in properties:
            all_features.extend(prop.key_features)
        
        if all_features:
            feature_freq = {}
            for feature in set(all_features):
                feature_freq[feature] = all_features.count(feature)
            
            top_features = sorted(feature_freq.items(), key=lambda x: x[1], reverse=True)[:3]
            if top_features:
                insights.append({
                    'type': 'feature_trends',
                    'title': 'Most Common Features',
                    'description': f"Top features: {', '.join([f[0] for f in top_features])}",
                    'implication': 'These are expected features in this market segment'
                })
        
        # Location clustering insight
        locations = {}
        for prop in properties:
            if prop.sub_city:
                loc = prop.sub_city.name
                locations[loc] = locations.get(loc, 0) + 1
        
        if locations:
            max_location = max(locations.items(), key=lambda x: x[1])
            if max_location[1] > len(properties) * 0.4:
                insights.append({
                    'type': 'location_concentration',
                    'title': 'Location Concentration',
                    'description': f"{max_location[0]} has {max_location[1]} properties ({round(max_location[1]/len(properties)*100, 0)}%)",
                    'implication': 'High competition or popularity in this area'
                })
        
        # Condition insight
        ages = []
        for prop in properties:
            if prop.built_year:
                ages.append(timezone.now().year - prop.built_year)
        
        if ages:
            avg_age = sum(ages) / len(ages)
            if avg_age < 10:
                insights.append({
                    'type': 'newer_properties',
                    'title': 'Modern Properties',
                    'description': f"Average property age: {round(avg_age, 1)} years",
                    'implication': 'Market trending towards newer constructions'
                })
            elif avg_age > 25:
                insights.append({
                    'type': 'older_properties',
                    'title': 'Established Properties',
                    'description': f"Average property age: {round(avg_age, 1)} years",
                    'implication': 'Established neighborhood, potential for renovation'
                })
        
        return insights
    
    @staticmethod
    def _assess_risks(properties):
        """Assess risks for each property"""
        risks = {
            'overall_risk_level': 'low',
            'property_risks': {},
            'common_risks': []
        }
        
        common_risks = []
        
        for prop in properties:
            prop_risks = []
            risk_score = 0
            
            # Documentation risks
            if not prop.has_title_deed:
                prop_risks.append({
                    'type': 'documentation',
                    'severity': 'high',
                    'description': 'No title deed available',
                    'mitigation': 'Require title deed verification before purchase'
                })
                risk_score += 3
            
            # Age risks
            if prop.built_year:
                age = timezone.now().year - prop.built_year
                if age > 30:
                    prop_risks.append({
                        'type': 'condition',
                        'severity': 'medium',
                        'description': f"Property age: {age} years",
                        'mitigation': 'Schedule professional inspection'
                    })
                    risk_score += 2
            
            # Market risks
            if prop.days_on_market > 120:
                prop_risks.append({
                    'type': 'market',
                    'severity': 'medium',
                    'description': f"On market for {prop.days_on_market} days",
                    'mitigation': 'Investigate reasons for slow sale'
                })
                risk_score += 1
            
            # Price risks
            if prop.price_etb and prop.total_area:
                price_sqm = prop.price_etb / prop.total_area
                # Compare with similar properties
                similar_props = [p for p in properties if p != prop and p.property_type == prop.property_type]
                if similar_props:
                    similar_prices = [p.price_etb / p.total_area for p in similar_props if p.price_etb and p.total_area]
                    if similar_prices:
                        avg_similar = sum(similar_prices) / len(similar_prices)
                        if price_sqm > avg_similar * 1.3:
                            prop_risks.append({
                                'type': 'pricing',
                                'severity': 'medium',
                                'description': f"Price {round((price_sqm/avg_similar-1)*100, 1)}% above similar properties",
                                'mitigation': 'Verify value proposition or negotiate'
                            })
                            risk_score += 2
            
            # Determine overall risk level
            if risk_score >= 5:
                risk_level = 'high'
            elif risk_score >= 3:
                risk_level = 'medium'
            else:
                risk_level = 'low'
            
            risks['property_risks'][prop.id] = {
                'risk_score': risk_score,
                'risk_level': risk_level,
                'risks': prop_risks
            }
            
            # Collect common risks
            for risk in prop_risks:
                if risk['type'] not in [r['type'] for r in common_risks]:
                    common_risks.append(risk)
        
        risks['common_risks'] = common_risks
        
        # Determine overall risk level
        risk_scores = [r['risk_score'] for r in risks['property_risks'].values()]
        if risk_scores:
            avg_risk = sum(risk_scores) / len(risk_scores)
            if avg_risk >= 4:
                risks['overall_risk_level'] = 'high'
            elif avg_risk >= 2:
                risks['overall_risk_level'] = 'medium'
        
        return risks
    
    @staticmethod
    def _calculate_avg_price_sqm(properties):
        """Calculate average price per square meter"""
        valid_prices = []
        for prop in properties:
            if prop.price_etb and prop.total_area:
                valid_prices.append(prop.price_etb / prop.total_area)
        
        if valid_prices:
            return sum(valid_prices) / len(valid_prices)
        return None
    
    @staticmethod
    def _calculate_std_dev(values):
        """Calculate standard deviation"""
        if not values:
            return 0
        
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return math.sqrt(variance)
    
    @staticmethod
    def _identify_key_findings(properties):
        """Identify key findings from comparison"""
        findings = []
        
        # Price range finding
        prices = [p.price_etb for p in properties if p.price_etb]
        if prices:
            price_range = max(prices) - min(prices)
            if price_range > sum(prices) / len(prices) * 0.4:
                findings.append("Wide price range suggests varied property conditions or locations")
            else:
                findings.append("Narrow price range indicates consistent market pricing")
        
        # Feature consistency finding
        all_features = set()
        for prop in properties:
            all_features.update(prop.key_features)
        
        if all_features:
            avg_features = sum(len(p.key_features) for p in properties) / len(properties)
            if avg_features > 5:
                findings.append("Properties generally feature-rich")
            else:
                findings.append("Basic property offerings in comparison")
        
        # Location finding
        cities = {}
        for prop in properties:
            if prop.city:
                cities[prop.city.name] = cities.get(prop.city.name, 0) + 1
        
        if len(cities) == 1:
            findings.append("All properties in the same city")
        elif len(cities) == len(properties):
            findings.append("Each property in a different city")
        
        return findings
    
    @staticmethod
    def get_comparison_metrics(properties):
        """Get key comparison metrics"""
        metrics = {
            'count': len(properties),
            'price_metrics': {},
            'area_metrics': {},
            'feature_metrics': {},
            'age_metrics': {},
            'market_metrics': {}
        }
        
        # Price metrics
        prices = [p.price_etb for p in properties if p.price_etb]
        if prices:
            metrics['price_metrics'] = {
                'min': min(prices),
                'max': max(prices),
                'average': sum(prices) / len(prices),
                'median': sorted(prices)[len(prices) // 2],
                'range': max(prices) - min(prices)
            }
        
        # Area metrics
        areas = [p.total_area for p in properties if p.total_area]
        if areas:
            metrics['area_metrics'] = {
                'min': min(areas),
                'max': max(areas),
                'average': sum(areas) / len(areas),
                'median': sorted(areas)[len(areas) // 2]
            }
        
        # Feature metrics
        feature_counts = [len(p.key_features) for p in properties]
        if feature_counts:
            metrics['feature_metrics'] = {
                'avg_features': sum(feature_counts) / len(feature_counts),
                'max_features': max(feature_counts),
                'min_features': min(feature_counts),
                'total_unique_features': len(set().union(*[set(p.key_features) for p in properties]))
            }
        
        # Age metrics enhance
        ages = [timezone.now().year - p.built_year for p in properties if p.built_year]
        if ages:
            metrics['age_metrics'] = {
                'avg_age': sum(ages) / len(ages),
                'newest': min(ages),
                'oldest': max(ages),
                'under_5_years': len([a for a in ages if a <= 5]),
                'over_20_years': len([a for a in ages if a >= 20])
            }
        
        # Market metrics
        metrics['market_metrics'] = {
            'avg_days_on_market': sum(p.days_on_market for p in properties) / len(properties),
            'total_views': sum(p.views_count for p in properties),
            'total_inquiries': sum(p.inquiry_count for p in properties),
            'total_saves': sum(p.save_count for p in properties),
            'featured_count': sum(1 for p in properties if p.is_featured),
            'verified_count': sum(1 for p in properties if p.is_verified)
        }
        
        return metrics
    
    @staticmethod
    def find_similar_properties(property, limit=5, include_current=False):
        """Find similar properties for comparison"""
        from .models import Property
        
        # Build similarity query
        similar_properties = Property.objects.filter(
            is_active=True,
            property_type=property.property_type,
            listing_type=property.listing_type
        )
        
        if property.city:
            similar_properties = similar_properties.filter(city=property.city)
        
        if property.bedrooms:
            similar_properties = similar_properties.filter(
                bedrooms__gte=property.bedrooms - 1,
                bedrooms__lte=property.bedrooms + 1
            )
        
        if property.price_etb:
            price_range = property.price_etb * Decimal('0.2')  # ±20%
            similar_properties = similar_properties.filter(
                price_etb__gte=property.price_etb - price_range,
                price_etb__lte=property.price_etb + price_range
            )
        
        # Exclude current property if requested
        if not include_current:
            similar_properties = similar_properties.exclude(id=property.id)
        
        # Order by similarity score
        similar_properties = similar_properties.annotate(
            similarity_score=PropertyComparisonService._calculate_similarity_score(property)
        ).order_by('-similarity_score')[:limit]
        
        return similar_properties
    
    @staticmethod
    def _calculate_similarity_score(base_property):
        """Calculate similarity score for query annotation"""
        from django.db.models import Case, When, Value, IntegerField, F, ExpressionWrapper, FloatField
        from django.db.models.functions import Abs, Coalesce
        
        score = 0
        
        # Location similarity (40 points)
        location_score = Case(
            When(city=base_property.city, then=Value(20)),
            default=Value(0),
            output_field=IntegerField()
        )
        
        subcity_score = Case(
            When(sub_city=base_property.sub_city, then=Value(20)),
            default=Value(0),
            output_field=IntegerField()
        )
        
        # Price similarity (30 points)
        if base_property.price_etb:
            price_diff = Abs(F('price_etb') - base_property.price_etb) / base_property.price_etb
            price_score = ExpressionWrapper(
                Case(
                    When(price_diff__lte=0.1, then=Value(30)),
                    When(price_diff__lte=0.2, then=Value(20)),
                    When(price_diff__lte=0.3, then=Value(10)),
                    default=Value(0),
                    output_field=IntegerField()
                ),
                output_field=IntegerField()
            )
        else:
            price_score = Value(0, output_field=IntegerField())
        
        # Size similarity (20 points)
        if base_property.total_area:
            area_diff = Abs(F('total_area') - base_property.total_area) / base_property.total_area
            area_score = ExpressionWrapper(
                Case(
                    When(area_diff__lte=0.1, then=Value(20)),
                    When(area_diff__lte=0.2, then=Value(15)),
                    When(area_diff__lte=0.3, then=Value(10)),
                    default=Value(0),
                    output_field=IntegerField()
                ),
                output_field=IntegerField()
            )
        else:
            area_score = Value(0, output_field=IntegerField())
        
        # Bedroom similarity (10 points)
        bedroom_score = Case(
            When(bedrooms=base_property.bedrooms, then=Value(10)),
            When(bedrooms=base_property.bedrooms + 1, then=Value(7)),
            When(bedrooms=base_property.bedrooms - 1, then=Value(7)),
            default=Value(0),
            output_field=IntegerField()
        )
        
        # Combine scores
        return ExpressionWrapper(
            location_score + subcity_score + price_score + area_score + bedroom_score,
            output_field=IntegerField()
        )