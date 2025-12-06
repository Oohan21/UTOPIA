# real_estate/comparison.py
from django.db.models import Q
from decimal import Decimal

class PropertyComparisonService:
    @staticmethod
    def calculate_score(property, criteria):
        """Calculate a score for property based on comparison criteria"""
        score = 0
        total_weight = 0
        
        # Price scoring (lower is better for buyers)
        if criteria.get('target_price'):
            target_price = Decimal(criteria['target_price'])
            price_diff = abs(property.price_etb - target_price)
            price_score = max(0, 100 - (price_diff / target_price * 100))
            score += price_score * criteria.get('price_weight', 0.3)
            total_weight += criteria.get('price_weight', 0.3)
        
        # Area scoring (closer to target is better)
        if criteria.get('target_area'):
            target_area = Decimal(criteria['target_area'])
            area_diff = abs(property.total_area - target_area)
            area_score = max(0, 100 - (area_diff / target_area * 100))
            score += area_score * criteria.get('area_weight', 0.2)
            total_weight += criteria.get('area_weight', 0.2)
        
        # Features scoring
        if criteria.get('required_features'):
            required_features = criteria['required_features']
            property_features = property.key_features
            matched_features = sum(1 for feat in required_features if feat in property_features)
            if required_features:
                feature_score = (matched_features / len(required_features)) * 100
                score += feature_score * criteria.get('features_weight', 0.2)
                total_weight += criteria.get('features_weight', 0.2)
        
        # Location scoring
        if criteria.get('preferred_locations'):
            preferred_locations = criteria['preferred_locations']
            location_score = 100 if property.sub_city.name in preferred_locations else 0
            score += location_score * criteria.get('location_weight', 0.3)
            total_weight += criteria.get('location_weight', 0.3)
        
        # Normalize score
        if total_weight > 0:
            score = score / total_weight
        
        return round(score, 2)
    
    @staticmethod
    def generate_comparison_report(properties):
        """Generate a detailed comparison report"""
        if len(properties) < 2:
            return None
        
        report = {
            'summary': {
                'total_properties': len(properties),
                'price_range': {
                    'min': min(p.price_etb for p in properties),
                    'max': max(p.price_etb for p in properties),
                    'avg': sum(p.price_etb for p in properties) / len(properties)
                },
                'best_value': None,
                'most_features': None,
            },
            'property_scores': {},
            'recommendations': []
        }
        
        # Calculate scores for each property
        for prop in properties:
            score = PropertyComparisonService.calculate_basic_score(prop, properties)
            report['property_scores'][prop.id] = score
        
        # Find best value (price per sqm)
        best_value = min(properties, key=lambda p: p.price_per_sqm)
        report['summary']['best_value'] = {
            'property_id': best_value.id,
            'title': best_value.title,
            'price_per_sqm': best_value.price_per_sqm
        }
        
        # Find property with most features
        most_features = max(properties, key=lambda p: len(p.key_features))
        report['summary']['most_features'] = {
            'property_id': most_features.id,
            'title': most_features.title,
            'feature_count': len(most_features.key_features)
        }
        
        # Generate recommendations
        report['recommendations'] = PropertyComparisonService.generate_recommendations(properties)
        
        return report
    
    @staticmethod
    def calculate_basic_score(property, all_properties):
        """Calculate a basic comparison score"""
        scores = []
        
        # Price score (lower price per sqm is better)
        price_per_sqm_values = [p.price_per_sqm for p in all_properties]
        if price_per_sqm_values:
            min_price = min(price_per_sqm_values)
            max_price = max(price_per_sqm_values)
            if max_price > min_price:
                price_score = 100 - ((property.price_per_sqm - min_price) / (max_price - min_price) * 100)
                scores.append(price_score)
        
        # Feature score
        feature_counts = [len(p.key_features) for p in all_properties]
        if feature_counts:
            max_features = max(feature_counts)
            if max_features > 0:
                feature_score = (len(property.key_features) / max_features) * 100
                scores.append(feature_score)
        
        # Days on market score (fewer days is better for sellers)
        days_on_market_values = [p.days_on_market for p in all_properties]
        if days_on_market_values:
            max_days = max(days_on_market_values)
            if max_days > 0:
                market_score = 100 - (property.days_on_market / max_days * 100)
                scores.append(market_score)
        
        return round(sum(scores) / len(scores), 2) if scores else 0
    
    @staticmethod
    def generate_recommendations(properties):
        """Generate recommendations based on comparison"""
        recommendations = []
        
        # Price-based recommendations
        avg_price = sum(p.price_etb for p in properties) / len(properties)
        for prop in properties:
            if prop.price_etb < avg_price * 0.9:
                recommendations.append({
                    'type': 'price',
                    'property_id': prop.id,
                    'title': prop.title,
                    'message': f"Good value - priced {round((1 - (prop.price_etb / avg_price)) * 100, 1)}% below average"
                })
        
        # Feature-based recommendations
        for prop in properties:
            if prop.is_verified and prop.has_title_deed:
                recommendations.append({
                    'type': 'documentation',
                    'property_id': prop.id,
                    'title': prop.title,
                    'message': "Full documentation available"
                })
        
        return recommendations