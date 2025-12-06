from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from real_estate.models import City, SubCity, Property, Amenity
from faker import Faker
import random
from decimal import Decimal

User = get_user_model()
fake = Faker()

class Command(BaseCommand):
    help = 'Seed database with sample data'
    
    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting to seed database...'))
        
        # Create superuser
        self.create_superuser()
        
        # Create cities
        cities = self.create_cities()
        
        # Create sub-cities
        sub_cities = self.create_sub_cities(cities)
        
        # Create amenities
        amenities = self.create_amenities()
        
        # Create test users
        users = self.create_test_users()
        
        # Create properties
        self.create_properties(users, cities, sub_cities, amenities)
        
        self.stdout.write(self.style.SUCCESS('Database seeding completed!'))
    
    def create_superuser(self):
        if not User.objects.filter(email='admin@utopia.com').exists():
            User.objects.create_superuser(
                email='admin@utopia.com',
                password='admin123',
                first_name='Admin',
                last_name='User',
                phone_number='+251911223344',
                user_type='admin',
                is_verified=True
            )
            self.stdout.write(self.style.SUCCESS('Created superuser: admin@utopia.com'))
    
    def create_cities(self):
        cities_data = [
            {'name': 'Addis Ababa', 'name_amharic': 'አዲስ አበባ', 'is_capital': True, 'population': 3500000},
            {'name': 'Bahir Dar', 'name_amharic': 'ባሕር ዳር', 'is_capital': False, 'population': 300000},
            {'name': 'Hawassa', 'name_amharic': 'ሀዋሳ', 'is_capital': False, 'population': 400000},
            {'name': 'Mekelle', 'name_amharic': 'ምቀሌ', 'is_capital': False, 'population': 500000},
            {'name': 'Adama', 'name_amharic': 'አዳማ', 'is_capital': False, 'population': 350000},
        ]
        
        cities = []
        for city_data in cities_data:
            city, created = City.objects.get_or_create(**city_data)
            if created:
                cities.append(city)
                self.stdout.write(self.style.SUCCESS(f'Created city: {city.name}'))
        
        return cities
    
    def create_sub_cities(self, cities):
        sub_cities_data = [
            # Addis Ababa
            {'city': cities[0], 'name': 'Bole', 'name_amharic': 'ቦሌ', 'is_popular': True},
            {'city': cities[0], 'name': 'CMC', 'name_amharic': 'ሲ.ኤም.ሲ', 'is_popular': True},
            {'city': cities[0], 'name': 'Kirkos', 'name_amharic': 'ቂርቆስ', 'is_popular': True},
            {'city': cities[0], 'name': 'Yeka', 'name_amharic': 'የካ', 'is_popular': False},
            {'city': cities[0], 'name': 'Lideta', 'name_amharic': 'ልደታ', 'is_popular': True},
            # Bahir Dar
            {'city': cities[1], 'name': 'Center', 'name_amharic': 'ማዕከል', 'is_popular': True},
            {'city': cities[1], 'name': 'Shum Abo', 'name_amharic': 'ሹም አቦ', 'is_popular': False},
        ]
        
        sub_cities = []
        for sub_city_data in sub_cities_data:
            sub_city, created = SubCity.objects.get_or_create(**sub_city_data)
            if created:
                sub_cities.append(sub_city)
                self.stdout.write(self.style.SUCCESS(f'Created sub-city: {sub_city.city.name} - {sub_city.name}'))
        
        return sub_cities
    
    def create_amenities(self):
        amenities_data = [
            {'name': 'Parking', 'amenity_type': 'general', 'icon': 'fa-car'},
            {'name': 'Security', 'amenity_type': 'security', 'icon': 'fa-shield-alt'},
            {'name': 'Garden', 'amenity_type': 'recreational', 'icon': 'fa-tree'},
            {'name': 'Swimming Pool', 'amenity_type': 'recreational', 'icon': 'fa-swimming-pool'},
            {'name': 'Gym', 'amenity_type': 'recreational', 'icon': 'fa-dumbbell'},
            {'name': 'Internet', 'amenity_type': 'utility', 'icon': 'fa-wifi'},
            {'name': 'Generator', 'amenity_type': 'utility', 'icon': 'fa-bolt'},
            {'name': 'Air Conditioning', 'amenity_type': 'utility', 'icon': 'fa-snowflake'},
        ]
        
        amenities = []
        for amenity_data in amenities_data:
            amenity, created = Amenity.objects.get_or_create(**amenity_data)
            if created:
                amenities.append(amenity)
                self.stdout.write(self.style.SUCCESS(f'Created amenity: {amenity.name}'))
        
        return amenities
    
    def create_test_users(self):
        users_data = [
            {
                'email': 'agent@example.com',
                'password': 'password123',
                'first_name': 'Michael',
                'last_name': 'Agent',
                'phone_number': '+251922334455',
                'user_type': 'agent',
                'agent_license_number': 'AGENT-001',
                'agency_name': 'Elite Real Estate',
                'years_of_experience': 5,
            },
            {
                'email': 'seller@example.com',
                'password': 'password123',
                'first_name': 'Sarah',
                'last_name': 'Seller',
                'phone_number': '+251933445566',
                'user_type': 'seller',
            },
            {
                'email': 'buyer@example.com',
                'password': 'password123',
                'first_name': 'John',
                'last_name': 'Buyer',
                'phone_number': '+251944556677',
                'user_type': 'buyer',
            },
            {
                'email': 'developer@example.com',
                'password': 'password123',
                'first_name': 'David',
                'last_name': 'Developer',
                'phone_number': '+251955667788',
                'user_type': 'developer',
            },
        ]
        
        users = []
        for user_data in users_data:
            email = user_data['email']
            if not User.objects.filter(email=email).exists():
                password = user_data.pop('password')
                user = User.objects.create(**user_data)
                user.set_password(password)
                user.save()
                users.append(user)
                self.stdout.write(self.style.SUCCESS(f'Created user: {email}'))
        
        return users
    
    def create_properties(self, users, cities, sub_cities, amenities):
        property_types = ['house', 'apartment', 'villa', 'commercial']
        listing_types = ['for_sale', 'for_rent']
        furnishing_types = ['unfurnished', 'semi_furnished', 'fully_furnished']
        
        for i in range(50):  # Create 50 sample properties
            city = random.choice(cities)
            city_sub_cities = [sc for sc in sub_cities if sc.city == city]
            sub_city = random.choice(city_sub_cities) if city_sub_cities else None
            
            property_type = random.choice(property_types)
            listing_type = random.choice(listing_types)
            
            # Generate property data
            property_data = {
                'title': f'{property_type.title()} in {sub_city.name if sub_city else city.name}',
                'title_amharic': f'{sub_city.name_amharic if sub_city else city.name_amharic} ውስጥ ያለ {property_type}',
                'description': fake.text(max_nb_chars=500),
                'description_amharic': fake.text(max_nb_chars=500),
                'property_type': property_type,
                'listing_type': listing_type,
                'property_status': 'available',
                'owner': random.choice(users),
                'agent': random.choice([u for u in users if u.user_type == 'agent']),
                'city': city,
                'sub_city': sub_city,
                'specific_location': fake.address(),
                'latitude': fake.latitude(),
                'longitude': fake.longitude(),
                'bedrooms': random.randint(1, 5),
                'bathrooms': random.randint(1, 4),
                'total_area': Decimal(random.uniform(50, 500)),
                'plot_size': Decimal(random.uniform(100, 1000)) if property_type in ['house', 'villa', 'land'] else None,
                'built_year': random.randint(2000, 2023),
                'floors': random.randint(1, 3),
                'furnishing_type': random.choice(furnishing_types),
                'price_etb': Decimal(random.uniform(1000000, 10000000)),
                'price_negotiable': random.choice([True, False]),
                'has_parking': random.choice([True, False]),
                'has_security': random.choice([True, False]),
                'has_garden': random.choice([True, False]),
                'has_internet': random.choice([True, False]),
                'is_featured': random.choice([True, False]),
                'is_verified': random.choice([True, False]),
            }
            
            if listing_type == 'for_rent':
                property_data['monthly_rent'] = Decimal(random.uniform(5000, 50000))
                property_data['security_deposit'] = property_data['monthly_rent'] * 2
            
            # Create property
            property_obj = Property.objects.create(**property_data)
            
            # Add random amenities
            property_amenities = random.sample(amenities, random.randint(2, 5))
            property_obj.amenities.set(property_amenities)
            
            self.stdout.write(self.style.SUCCESS(f'Created property: {property_obj.title}'))